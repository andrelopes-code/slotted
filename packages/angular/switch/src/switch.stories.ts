import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { signal } from '@angular/core';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlStack } from '@slotted/angular/stack';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlSwitch } from './switch';
import type { SwitchIndicator, SwitchLabelPlacement, SwitchSize } from './switch-defaults';
import { SlSwitchDescription } from './switch-parts';
import { ANGULAR_SWITCH_DOCS, ANGULAR_SWITCH_TOKENS } from './switch.docs';

interface SwitchStoryArgs {
  indicator: SwitchIndicator;
  labelPlacement: SwitchLabelPlacement;
  loading: boolean;
  size: SwitchSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SWITCH_DOCS.switch.scenes, {
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

const DIRECTIVES = [
  SlField,
  SlFieldError,
  SlFieldGroup,
  SlFieldGroupLegend,
  SlFieldLabel,
  SlStack,
  SlSwitch,
  SlSwitchDescription,
];

const meta: Meta<SwitchStoryArgs> = {
  title: 'Components/Switch',
  component: SlSwitch,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Switch',
        description:
          'A binary setting that takes effect immediately, built on the checkbox the platform already ships and able to say that the effect has not landed yet.',
        framework: 'Angular',
        ...ANGULAR_SWITCH_DOCS.switch,
        tokens: ANGULAR_SWITCH_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SwitchStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    indicator: 'mark',
    labelPlacement: 'end',
    loading: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <span
          slSwitch
          defaultChecked
          name="autopay"
          [size]="size"
          [indicator]="indicator"
          [labelPlacement]="labelPlacement"
          [loading]="loading"
        >
          Automatic billing
          <p slSwitchDescription>The invoice is charged on the 5th of each month.</p>
        </span>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps on their own',
        'Pill, thumb, mark and label all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
        `<span slSwitch size="sm" defaultChecked>Compact</span>
         <span slSwitch size="md" defaultChecked>Default</span>
         <span slSwitch size="lg" defaultChecked>Comfortable</span>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'A small field holding a medium control is a field and a control disagreeing about one row, so the switch reads the field’s step before the application token’s.',
          `<div slField size="sm">
             <label slFieldLabel>Notifications</label>
             <span slSwitch defaultChecked>By email</span>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Maintenance</label>
             <span slSwitch>Maintenance mode</span>
           </div>`,
        ),
    ),
  }),
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A check when it is on, and nothing when it is off',
        'The mark is what makes the state readable beyond colour and beyond position: a switch you cannot compare to another still says which way it is set.',
        `<span slSwitch defaultChecked>Com marca, ligado</span>
         <span slSwitch>Com marca, desligado</span>`,
      ) +
        scene(
          'Withdrawn, where something else carries the state',
          'indicator="none" leaves colour and position as the whole of the signal, which is what the mark exists to avoid — so it belongs beside a label that already says the state.',
          `<span slSwitch indicator="none" defaultChecked>Sem marca, ligado</span>
           <span slSwitch indicator="none">Sem marca, desligado</span>`,
        ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The label after the pill',
        'The default, and the arrangement a single control in a form wants: the pill leads and the label reads as its name.',
        `<span slSwitch defaultChecked>Alertas por e-mail</span>
         <span slSwitch>Resumo semanal</span>`,
        'block',
      ) +
        scene(
          'The label first, and the pill at the end',
          'The settings row. The label takes the free width, so a column of rows ends with every pill at the same distance from the edge however long the labels are.',
          `<span slSwitch labelPlacement="start" defaultChecked>Email alerts</span>
           <span slSwitch labelPlacement="start">Weekly summary of overdue orders</span>
           <span slSwitch labelPlacement="start">Staging environment</span>`,
          'block',
        ),
    ),
  }),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Under the label, never inside it',
        'Inside the label it would join the accessible name, and a paragraph of help text that toggles a setting when it is clicked is a paragraph nobody reads.',
        `<span slSwitch defaultChecked>
           Automatic billing
           <p slSwitchDescription>
             The invoice is charged on the 5th of each month, using the account’s default payment method.
           </p>
         </span>`,
        'block',
      ) +
        scene(
          'At 360 pixels',
          'The label wraps and the description wraps with it; the pill never shrinks, because the pill is the target and the text is what can give up width.',
          measure(
            `<span slSwitch labelPlacement="start">
               Automatic order sync
               <p slSwitchDescription>Checks the queue every five minutes.</p>
             </span>`,
          ),
          'block',
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Read-only, and invalid',
        'Read-only goes hollow and keeps the accent in its mark, because the value is real and still submitted; invalid draws the danger edge and retargets the focus ring to it.',
        `<span slSwitch defaultChecked readOnly>Production key</span>
         <span slSwitch invalid>I accept the terms</span>`,
        'block',
      ) +
        scene(
          'Disabled, and disabled by a fieldset',
          'The knob goes grey with the track, so a locked setting still says which way it is set. The one in the group was never told it is disabled: a fieldset disables what it holds, and the stylesheet matches :disabled beside the attribute.',
          `<span slSwitch defaultChecked disabled>Included in the plan</span>
           <fieldset slFieldGroup disabled>
             <legend slFieldGroupLegend>Integration</legend>
             <span slSwitch defaultChecked>Sync orders</span>
           </fieldset>`,
          'block',
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => {
    const on = signal(false);
    const saving = signal(false);

    return {
      props: {
        on,
        saving,
        save: (next: boolean) => {
          saving.set(true);
          setTimeout(() => {
            on.set(next);
            saving.set(false);
          }, 1200);
        },
      },
      template: grid(
        2,
        scene(
          'A write that has not returned',
          'Press it: the thumb holds its place, the arc turns where the mark was, and a second press is refused before the DOM can show a state the server does not have.',
          `<span
             slSwitch
             [checked]="on()"
             [loading]="saving()"
             [messages]="{ loading: 'Saving the preference' }"
             (checkedChange)="save($event.value)"
           >
             Automatic sync
           </span>`,
          'block',
        ) +
          scene(
            'Pending, on and off',
            'The pill keeps its size in both states, because a control that resizes while it saves moves the row under the pointer.',
            `<span slSwitch loading>Salvando, desligado</span>
             <span slSwitch loading defaultChecked>Salvando, ligado</span>`,
            'block',
          ),
      ),
    };
  },
};

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Nothing wires the control',
        'The switch reads the field for its description and the four shared states, and it keeps its own label — so the field’s label names the group of settings and the switch’s names the setting.',
        `<div slField>
           <label slFieldLabel>Billing preferences</label>
           <span slSwitch defaultChecked name="autopay">Charge automatically</span>
         </div>`,
        'block',
      ) +
        scene(
          'Required, and in error',
          'The field marks necessity and the control writes aria-required — never the native attribute, which would engage the browser’s own validation as a side effect.',
          `<div slField invalid required>
             <label slFieldLabel>Terms of use</label>
             <span slSwitch>I accept the terms</span>
             <p slFieldError>You must accept to continue.</p>
           </div>`,
          'block',
        ),
    ),
  }),
};

export const Settings: Story = {
  parameters: scenario('settings'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Where a switch actually lives',
        'Three rows, each one label, one sentence and one pill. The labels take the free width and the pills line up, whatever the labels say.',
        `<div slStack [gap]="7">
           <span slSwitch labelPlacement="start" defaultChecked>
             Email alerts
             <p slSwitchDescription>One notice for each overdue order.</p>
           </span>
           <span slSwitch labelPlacement="start">
             Staging environment
             <p slSwitchDescription>Orders created here are not billed.</p>
           </span>
           <span slSwitch labelPlacement="start" defaultChecked readOnly>
             Production key
             <p slSwitchDescription>Only the account owner can change this.</p>
           </span>
         </div>`,
        'block',
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The host element is the consumer’s own',
        'A span, a list item, a label — the control, the pill and the label are rendered into whatever the consumer wrote, which is where id, aria-* and formControlName belong.',
        `<span slSwitch defaultChecked name="digest">Weekly summary</span>
         <span slSwitch aria-label="No visible label"></span>`,
        'block',
      ) +
        scene(
          'Reaching the instance from the template',
          'exportAs gives the switch back: inputElement for focus(), and toggle(), which clicks the control and reports the move as programmatic rather than as a key press.',
          `<span slSwitch #box="slSwitch">Toggleable from code</span>`,
          'block',
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Tab, then Space',
        'Both are the platform’s. Tab reaches the control and the ring is drawn on the pill; Space toggles it, and the request says the reason was the keyboard.',
        `<span slSwitch>Desligado</span>
         <span slSwitch defaultChecked>Ligado</span>`,
        'block',
      ) +
        scene(
          'Enter is left to the form',
          'The APG lists Enter as optional. Inside a form it submits, so a switch that stole it would break the form for the sake of a shortcut nobody asked for.',
          `<form (submit)="$event.preventDefault()">
             <span slSwitch defaultChecked name="invoice">Receive the invoice by email</span>
           </form>`,
          'block',
        ),
    ),
  }),
};
