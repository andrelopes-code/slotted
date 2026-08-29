import type { Meta, StoryObj } from '@storybook/react-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { ButtonLink } from './button-link';

const ExternalIcon = () => (
  <span aria-hidden="true" className="slotted-demo-icon" data-icon="external" />
);
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta = {
  title: 'Components/Button family/ButtonLink',
  component: ButtonLink,
  args: { href: '/settings', children: 'Settings' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ButtonLink',
        description: 'Native navigation with an optional narrow router adapter.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.buttonLink,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ButtonLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      <div className="slotted-demo-row">
        <ButtonLink href="/settings" trailing={<ExternalIcon />}>
          Settings
        </ButtonLink>
        <ButtonLink disabled href="/settings" trailing={<ExternalIcon />}>
          Disabled
        </ButtonLink>
      </div>
    </div>
  ),
};
export const RouterIntegration: Story = {
  parameters: scenario('routerIntegration'),
  render: () => (
    <ButtonLink
      render={(props) => <a {...props} href="/settings" data-router-link="true" />}
      trailing={<ExternalIcon />}
    >
      Router settings
    </ButtonLink>
  ),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <>
      <ButtonLink href="/settings" aria-describedby="settings-help">
        Settings
      </ButtonLink>
      <span className="slotted-visually-hidden" id="settings-help">
        Opens account settings.
      </span>
    </>
  ),
};
