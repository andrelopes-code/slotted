import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Text } from '../typography';
import { DemoScene } from './tag-demo';
import { TagGroup } from './tag-group';
import { TagToggle } from './tag-toggle';
import { REACT_TAG_DOCS, REACT_TAG_TOKENS } from './tag.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Tag/TagToggle',
  component: TagToggle,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TagToggle',
        description:
          'A chip that holds a selection. Controlled or uncontrolled, decided once — the half Carbon, Ant, Fluent and Primer all leave to the consumer.',
        framework: 'React',
        ...REACT_TAG_DOCS.tagToggle,
        tokens: REACT_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof TagToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: 'Somente abertos',
    shape: 'pill',
    size: 'md',
    tone: 'accent',
    variant: 'soft',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <TagToggle {...args} />
      </div>
    </div>
  ),
};

const FACETS = ['Open', 'In review', 'Blocked', 'Delivered'];

/** The controlled set, which is the shape a filter bar actually has. */
export function SelectionStoryAdapter({ children }: { children?: ReactNode }) {
  const [chosen, setChosen] = useState<readonly string[]>(['Aberto']);

  return (
    <div className="slotted-demo-stack">
      <TagGroup aria-label="Status">
        {FACETS.map((facet) => (
          <TagToggle
            key={facet}
            onSelectedChange={(next) =>
              setChosen(next ? [...chosen, facet] : chosen.filter((it) => it !== facet))
            }
            selected={chosen.includes(facet)}
            tone="accent"
          >
            {facet}
          </TagToggle>
        ))}
      </TagGroup>
      <Text tone="muted">{chosen.length === 0 ? 'No status chosen' : chosen.join(', ')}</Text>
      {children}
    </div>
  );
}

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="controlled"
        note="The application owns the set. Each chip announces aria-pressed, and the request says whether the pointer or the keyboard moved it."
      >
        <SelectionStoryAdapter />
      </DemoScene>
      <DemoScene
        label="uncontrolled"
        note="The chip owns its own selection and starts from a value read once. A later change to that value is not silently adopted."
      >
        <TagGroup aria-label="Preferences">
          <TagToggle defaultSelected>Notify by email</TagToggle>
          <TagToggle>Notify by push</TagToggle>
          <TagToggle disabled>Notificar por SMS</TagToggle>
          <TagToggle defaultSelected disabled variant="solid">
            Digest semanal
          </TagToggle>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="selected and removable"
        note="A chosen facet that can also be taken out of the bar. Two controls, two targets, one chip."
      >
        <TagGroup aria-label="Facetas">
          <TagToggle defaultSelected onRemove={() => undefined} tone="success">
            Delivered
          </TagToggle>
          <TagToggle onRemove={() => undefined} tone="warning">
            In review
          </TagToggle>
        </TagGroup>
      </DemoScene>
    </div>
  ),
};
