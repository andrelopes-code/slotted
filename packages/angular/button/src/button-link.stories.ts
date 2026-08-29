import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import { provideRouter, RouterLink } from '@angular/router';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlButtonLink } from './button-link';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta: Meta = {
  title: 'Components/Button family/ButtonLink',
  component: SlButtonLink,
  decorators: [moduleMetadata({ imports: [SlButtonLink] })],
  args: { href: '/settings' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ButtonLink',
        description: 'Native navigation with Angular Router integration.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.buttonLink,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: () => ({ template: '<a slButtonLink href="/settings">Settings</a>' }),
};
export default meta;
type Story = StoryObj;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template:
      '<div style="display:flex;gap:12px"><a slButtonLink href="/settings">Default</a><a slButtonLink href="/settings" disabled>Disabled</a></div>',
  }),
};
export const RouterIntegration: Story = {
  decorators: [
    applicationConfig({ providers: [provideRouter([])] }),
    moduleMetadata({ imports: [SlButtonLink, RouterLink] }),
  ],
  parameters: scenario('routerIntegration'),
  render: () => ({ template: '<a slButtonLink routerLink="/settings">Settings</a>' }),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template:
      '<a slButtonLink href="/settings" aria-describedby="settings-help">Settings</a><span class="slotted-visually-hidden" id="settings-help">Opens account settings.</span>',
  }),
};
