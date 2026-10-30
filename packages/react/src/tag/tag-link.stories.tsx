import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { VisuallyHidden } from '../visually-hidden';
import { DemoScene } from './tag-demo';
import { TagGroup } from './tag-group';
import { TagLink } from './tag-link';
import { REACT_TAG_DOCS, REACT_TAG_TOKENS } from './tag.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Tag/TagLink',
  component: TagLink,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TagLink',
        description:
          'A chip that navigates. A real anchor, so middle click, the context menu, download and “open in new tab” all keep working.',
        framework: 'React',
        ...REACT_TAG_DOCS.tagLink,
        tokens: REACT_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof TagLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: '#plataforma',
    href: '#tag-link-playground',
    shape: 'pill',
    size: 'md',
    tone: 'accent',
    variant: 'soft',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <TagLink {...args} />
      </div>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="destinations"
        note="A destination the browser owns, one a router owns through render, and one that also removes."
      >
        <TagGroup aria-label="Destinos">
          <TagLink href="#equipes">#plataforma</TagLink>
          <TagLink
            href="#equipes"
            render={(props) => <a {...props} data-router-link="true" />}
            tone="accent"
          >
            #produto
          </TagLink>
          <TagLink href="#equipes" onRemove={() => undefined}>
            #design
          </TagLink>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="unavailable"
        note="A chip that cannot be followed loses its href and announces aria-disabled: an anchor without a destination is not a link."
      >
        <TagGroup aria-label="Unavailable">
          <TagLink disabled href="#teams">
            #archived
          </TagLink>
          <TagLink disabled href="#equipes" onRemove={() => undefined} variant="outline">
            #encerrado
          </TagLink>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="external"
        note="A chip that leaves the origin says so in its own words. The external marker belongs to the link family, on a link."
      >
        <TagGroup aria-label="Externos" role="list">
          <TagLink href="https://www.w3.org/WAI/ARIA/apg/" rel="noreferrer" target="_blank">
            APG
            <VisuallyHidden> (abre em nova aba)</VisuallyHidden>
          </TagLink>
        </TagGroup>
      </DemoScene>
    </div>
  ),
};
