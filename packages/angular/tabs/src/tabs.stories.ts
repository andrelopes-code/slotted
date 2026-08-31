import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTab } from './tab';
import { SlTabList } from './tab-list';
import { SlTabPanel } from './tab-panel';
import { SlTabs } from './tabs';
import { ANGULAR_TABS_DOCS, ANGULAR_TABS_TOKENS } from './tabs.docs';
import type { TabsActivation, TabsOrientation } from './tabs.constants';

interface TabsStoryArgs {
  activation: TabsActivation;
  orientation: TabsOrientation;
}

const sections = [
  ['overview', 'Overview', 'Traffic, conversions and revenue for the period.'],
  ['usage', 'Usage', 'Requests, storage and seats against the plan limits.'],
  ['billing', 'Billing', 'Invoices, payment method and billing address.'],
] as const;

const report = (attributes = '') => `
  <div slTabs value="overview" ${attributes}>
    <div slTabList aria-label="Report sections">
      ${sections.map(([value, label]) => `<button slTab value="${value}">${label}</button>`).join('')}
    </div>
    ${sections.map(([value, , body]) => `<div slTabPanel value="${value}">${body}</div>`).join('')}
  </div>`;

const scene = (label: string, note: string, content: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${content}</div>
  </section>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta<TabsStoryArgs> = {
  title: 'Components/Tabs',
  component: SlTabs,
  decorators: [moduleMetadata({ imports: [SlTab, SlTabList, SlTabPanel, SlTabs] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tabs',
        description: 'Sibling panels with one visible at a time and a single tab stop.',
        framework: 'Angular',
        ...ANGULAR_TABS_DOCS.tabs,
        tokens: ANGULAR_TABS_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TabsStoryArgs>;

export const Playground: Story = {
  args: { activation: 'automatic', orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: report('[activation]="activation" [orientation]="orientation"'),
  }),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  ${scene('Horizontal', 'Arrow keys follow the same axis.', report('orientation="horizontal"'))}
  ${scene('Vertical', 'Arrow keys follow the same axis.', report('orientation="vertical"'))}
</div>`,
  }),
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  ${scene('Automatic', 'Moving focus selects in the same step.', report('activation="automatic"'))}
  ${scene('Manual', 'Focus moves; Enter or Space selects.', report('activation="manual"'))}
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div slTabs value="overview">
  <div slTabList aria-label="Report sections">
    <button slTab value="overview">Selected</button>
    <button slTab value="usage">Unselected</button>
    <button slTab disabled value="billing">Disabled</button>
  </div>
  <div slTabPanel value="overview">The selected tab carries data-selected.</div>
  <div slTabPanel value="usage">An unselected tab carries neither attribute.</div>
  <div slTabPanel value="billing">A disabled tab is skipped by the arrow keys.</div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div slTabs id="accessible-report" activation="manual" value="overview">
  <div slTabList aria-label="Report sections">
    ${sections.map(([value, label]) => `<button slTab value="${value}">${label}</button>`).join('')}
  </div>
  ${sections
    .map(
      ([value, , body]) =>
        `<div slTabPanel value="${value}"><p>${body}</p><p>Every panel stays mounted, so anything a consumer puts here keeps its state.</p></div>`,
    )
    .join('')}
</div>`,
  }),
};
