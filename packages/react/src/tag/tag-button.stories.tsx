import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Text } from '../typography';
import { Tag } from './tag';
import { TagButton } from './tag-button';
import { DemoScene, GLYPH_CHEVRON } from './tag-demo';
import { TagGroup } from './tag-group';
import { REACT_TAG_DOCS, REACT_TAG_TOKENS } from './tag.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Tag/TagButton',
  component: TagButton,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TagButton',
        description:
          'A chip that runs a command. The command is a real button, and it is the chip’s body rather than the chip itself, so a chip that both acts and removes stays legal HTML.',
        framework: 'React',
        ...REACT_TAG_DOCS.tagButton,
        tokens: REACT_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof TagButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: 'Assign owner',
    shape: 'pill',
    size: 'md',
    tone: 'accent',
    variant: 'soft',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <TagButton {...args} />
      </div>
    </div>
  ),
};

/** The overflow chip every surveyed group ships, composed from what this family has. */
function Overflow() {
  const people = [
    'Anna Reed',
    'Brian Shaw',
    'Caleb Lane',
    'Dana Nunn',
    'Eva Prescott',
    'Frank Moss',
  ];
  const [all, setAll] = useState(false);
  const shown = all ? people : people.slice(0, 3);

  return (
    <TagGroup aria-label="Participantes">
      {shown.map((person) => (
        <Tag key={person}>{person}</Tag>
      ))}
      {all ? null : (
        <TagButton end={GLYPH_CHEVRON} onClick={() => setAll(true)} tone="accent" variant="outline">
          +{people.length - shown.length}
        </TagButton>
      )}
    </TagGroup>
  );
}

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="states"
        note="Hover, press and focus answer on the control the pointer or the keyboard is on, never on the whole chip: the chip can hold two of them."
      >
        <TagGroup aria-label="States">
          <TagButton onClick={() => undefined}>Default</TagButton>
          <TagButton onClick={() => undefined} tone="accent">
            Accent
          </TagButton>
          <TagButton onClick={() => undefined} variant="solid">
            Preenchido
          </TagButton>
          <TagButton onClick={() => undefined} variant="outline">
            Contornado
          </TagButton>
          <TagButton disabled onClick={() => undefined}>
            Unavailable
          </TagButton>
          <TagButton onClick={() => undefined} onRemove={() => undefined}>
            Command and remove
          </TagButton>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="overflow"
        note="The “+N” control three surveyed groups build in. Here it is a TagButton the consumer places, because the surface it would reveal belongs to popover."
      >
        <div className="slotted-demo-stack">
          <Overflow />
          <Text tone="muted">
            The count belongs to the consumer: it slices its own list and puts a TagButton at the
            end.
          </Text>
        </div>
      </DemoScene>
    </div>
  ),
};
