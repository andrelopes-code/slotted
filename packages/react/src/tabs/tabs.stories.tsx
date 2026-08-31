import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tab } from './tab';
import { TabList } from './tab-list';
import { TabPanel } from './tab-panel';
import { Tabs } from './tabs';
import { REACT_TABS_DOCS, REACT_TABS_TOKENS } from './tabs.docs';

const sections = [
  ['overview', 'Overview', 'Traffic, conversions and revenue for the period.'],
  ['usage', 'Usage', 'Requests, storage and seats against the plan limits.'],
  ['billing', 'Billing', 'Invoices, payment method and billing address.'],
] as const;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tabs',
        description: 'Sibling panels with one visible at a time and a single tab stop.',
        framework: 'React',
        ...REACT_TABS_DOCS.tabs,
        tokens: REACT_TABS_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function Report(props: Partial<Parameters<typeof Tabs>[0]>) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabList aria-label="Report sections">
        {sections.map(([value, label]) => (
          <Tab key={value} value={value}>
            {label}
          </Tab>
        ))}
      </TabList>
      {sections.map(([value, , body]) => (
        <TabPanel key={value} value={value}>
          {body}
        </TabPanel>
      ))}
    </Tabs>
  );
}

export const Playground: Story = {
  args: { activation: 'automatic', orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <Report {...args} />,
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['horizontal', 'vertical'] as const).map((orientation) => (
        <section className="slotted-demo-scene" key={orientation}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </span>
            <span className="slotted-demo-scene__note">Arrow keys follow the same axis.</span>
          </header>
          <div className="slotted-demo-stage">
            <Report orientation={orientation} />
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['automatic', 'manual'] as const).map((activation) => (
        <section className="slotted-demo-scene" key={activation}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {activation === 'automatic' ? 'Automatic' : 'Manual'}
            </span>
            <span className="slotted-demo-scene__note">
              {activation === 'automatic'
                ? 'Moving focus selects in the same step.'
                : 'Focus moves; Enter or Space selects.'}
            </span>
          </header>
          <div className="slotted-demo-stage">
            <Report activation={activation} />
          </div>
        </section>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Report sections">
        <Tab value="overview">Selected</Tab>
        <Tab value="usage">Unselected</Tab>
        <Tab disabled value="billing">
          Disabled
        </Tab>
      </TabList>
      <TabPanel value="overview">The selected tab carries data-selected.</TabPanel>
      <TabPanel value="usage">An unselected tab carries neither attribute.</TabPanel>
      <TabPanel value="billing">A disabled tab is skipped by the arrow keys.</TabPanel>
    </Tabs>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Tabs activation="manual" defaultValue="overview" id="accessible-report">
      <TabList aria-label="Report sections">
        {sections.map(([value, label]) => (
          <Tab key={value} value={value}>
            {label}
          </Tab>
        ))}
      </TabList>
      {sections.map(([value, , body]) => (
        <TabPanel key={value} value={value}>
          <p>{body}</p>
          <p>Every panel stays mounted, so anything a consumer puts here keeps its state.</p>
        </TabPanel>
      ))}
    </Tabs>
  ),
};
