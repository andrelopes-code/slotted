import { signal } from '@angular/core';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '../../button/src/button';
import { SlAlert } from './alert';
import type { AlertFill, AlertLive, AlertSize, AlertVariant } from './alert';
import { SlAlertActions } from './alert-actions';
import { SlAlertDescription } from './alert-description';
import { SlAlertIcon } from './alert-icon';
import { SlAlertTitle } from './alert-title';
import { ANGULAR_ALERT_DOCS, ANGULAR_ALERT_TOKENS } from './alert.docs';

interface AlertStoryArgs {
  fill: AlertFill;
  live: AlertLive;
  size: AlertSize;
  variant: AlertVariant;
}

const VARIANTS = ['accent', 'secondary', 'success', 'warning', 'danger'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta: Meta<AlertStoryArgs> = {
  title: 'Components/Alert',
  component: SlAlert,
  decorators: [
    moduleMetadata({
      imports: [SlAlert, SlAlertActions, SlAlertDescription, SlAlertIcon, SlAlertTitle, SlButton],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Alert',
        description: 'A message in the page, announced only when it has to be.',
        framework: 'Angular',
        ...ANGULAR_ALERT_DOCS.alert,
        tokens: ANGULAR_ALERT_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<AlertStoryArgs>;

export const Playground: Story = {
  args: { fill: 'subtle', live: 'off', size: 'md', variant: 'accent' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slAlert [fill]="fill" [live]="live" [size]="size" [variant]="variant">
    <span slAlertIcon>i</span>
    <div slAlertTitle>Scheduled maintenance</div>
    <p slAlertDescription>
      The workspace will be read-only on Sunday between 02:00 and 04:00.
    </p>
  </div>
</div>`,
  }),
};

const fillScene = (fill: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${fill}</span>
      <span class="slotted-demo-scene__note">The five tones the library names, in one fill.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        ${VARIANTS.map(
          (variant) =>
            `<div slAlert fill="${fill}" size="sm" variant="${variant}"><div slAlertTitle>${variant}</div></div>`,
        ).join('\n        ')}
      </div>
    </div>
  </section>`;

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${fillScene('subtle')}
  ${fillScene('outline')}
  ${fillScene('solid')}
</div>`,
  }),
};

export const Live: Story = {
  parameters: scenario('live'),
  render: () => {
    const messages = signal<string[]>([]);
    return {
      props: {
        messages,
        send: () =>
          messages.update((current) => [...current, `Invoice ${current.length + 1} sent`]),
      },
      template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slAlert variant="accent">
      <div slAlertTitle>off &mdash; read in document order</div>
      <p slAlertDescription>No role. This message was on the page before anyone arrived.</p>
    </div>
    <div slAlert live="assertive" variant="danger">
      <div slAlertTitle>assertive &mdash; interrupts</div>
      <p slAlertDescription>role="alert". Reserve it for something going wrong now.</p>
    </div>
    <div class="slotted-demo-stack">
      <button slButton (click)="send()">Send an invoice</button>
      <div>
        @for (message of messages(); track message) {
          <div slAlert live="polite" variant="success">
            <span slAlertIcon>&#10003;</span>
            <div slAlertTitle>{{ message }}</div>
          </div>
        }
      </div>
    </div>
    <p>
      The polite messages above appear inside a container that was already in the document. A live
      region added at the same moment as its text is often not announced at all.
    </p>
  </div>
</div>`,
    };
  },
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div slAlert variant="danger">
    <span slAlertIcon>!</span>
    <div slAlertTitle>Payment failed</div>
    <p slAlertDescription>The card ending 4242 was declined by the issuer.</p>
    <div slAlertActions>
      <button slButton size="sm" variant="danger">Try another card</button>
    </div>
  </div>
  <p>
    The icon spans both rows and the actions sit in a column of their own, so the message reads as
    one block whether it has one line or three.
  </p>
</div>`,
  }),
};
