import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Text } from '../typography';
import { Tag } from './tag';
import { DemoScene, GLYPH_TAG } from './tag-demo';
import { TagGroup } from './tag-group';
import { REACT_TAG_DOCS, REACT_TAG_TOKENS } from './tag.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tag',
        description:
          'An entity, a filter or a compact value. Static here; a chip that acts, navigates or holds a selection is one of the other three members.',
        framework: 'React',
        ...REACT_TAG_DOCS.tag,
        tokens: REACT_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'Design', shape: 'pill', size: 'md', tone: 'secondary', variant: 'soft' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Tag {...args} />
      </div>
    </div>
  ),
};

/**
 * A real list, because a removal that removes nothing demonstrates nothing.
 * The reviewer can press the X, press Backspace on a focused chip, and watch
 * where the keyboard lands when the last one goes.
 */
export function RemovableStoryAdapter() {
  const [labels, setLabels] = useState([
    'Aberto',
    'Prioridade alta',
    'Time de plataforma',
    'Vencendo em 7 dias',
  ]);

  return (
    <div className="slotted-demo-stack">
      <TagGroup aria-label="Filtros ativos">
        {labels.map((label) => (
          <Tag key={label} onRemove={() => setLabels(labels.filter((it) => it !== label))}>
            {label}
          </Tag>
        ))}
      </TagGroup>
      <Text tone="muted">
        {labels.length === 0
          ? 'The last label left and focus stayed on the group: the next Tab continues from here.'
          : `${labels.length} filters. Backspace or Delete on a label removes the same one the X removes.`}
      </Text>
      <button onClick={() => setLabels(['Open', 'High priority'])} type="button">
        Repor
      </button>
    </div>
  );
}

export const Removal: Story = {
  parameters: scenario('removal'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="removal"
        note="The X, and Backspace or Delete on the chip. Focus goes to the control that took the removed one’s place, then to the last one, then to the group itself."
      >
        <RemovableStoryAdapter />
      </DemoScene>
      <DemoScene
        label="refused"
        note="A removal is a request. Refusing it leaves the chip and the keyboard where they were."
      >
        <TagGroup aria-label="Protected labels">
          <Tag onRemove={(request) => request.cancel()} tone="danger" variant="outline">
            Production
          </Tag>
          <Tag onRemove={() => undefined} removeDisabled tone="secondary">
            Somente leitura
          </Tag>
        </TagGroup>
      </DemoScene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="long"
        note="One line, clipped with an ellipsis. The whole value stays in the DOM, in the accessibility tree, and findable by page search."
      >
        <div style={{ maxInlineSize: '18rem' }}>
          <TagGroup aria-label="Long values">
            <Tag onRemove={() => undefined}>Approval requests pending at the regional office</Tag>
            <Tag variant="outline">
              Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz
            </Tag>
          </TagGroup>
        </div>
      </DemoScene>
      <DemoScene
        label="glyphs"
        note="A glyph before or after the words, in a box the family sizes and centres. The artwork is the consumer’s."
      >
        <TagGroup aria-label="Com glifos" role="list">
          <Tag start={GLYPH_TAG} tone="accent">
            entidade
          </Tag>
          <Tag start={GLYPH_TAG} onRemove={() => undefined} tone="success">
            delivered
          </Tag>
          <Tag shape="square" tone="warning" variant="outline">
            in review
          </Tag>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="direction"
        note="The label is a bidi isolate: its direction comes from its own first strong character, not from the page."
      >
        <TagGroup aria-label="Direction" role="list">
          <Tag>مرحبا</Tag>
          <Tag>#platform</Tag>
          <Tag onRemove={() => undefined}>עברית</Tag>
        </TagGroup>
      </DemoScene>
    </div>
  ),
};
