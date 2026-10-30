import { scenario, WorkbenchMatrix } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Heading, Text } from '../typography';
import { VisuallyHidden } from '../visually-hidden';
import { Tag } from './tag';
import { TagButton } from './tag-button';
import { TagDefaultsProvider } from './tag-defaults';
import { DemoScene, GLYPH_TAG, LabSection } from './tag-demo';
import { TagGroup } from './tag-group';
import { TagLink } from './tag-link';
import { TagToggle } from './tag-toggle';
import type { TagSize, TagTone, TagVariant } from './tag.types';

const TONES: readonly TagTone[] = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];
const VARIANTS: readonly TagVariant[] = ['solid', 'soft', 'outline', 'dashed'];
const SIZES: readonly TagSize[] = ['sm', 'md', 'lg'];

const meta = {
  title: 'Components/Tag/Overview',
  component: Tag,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

function Filters() {
  const [filters, setFilters] = useState(['Aberto', 'Prioridade alta', 'Time de plataforma']);
  const [onlyMine, setOnlyMine] = useState(false);

  return (
    <TagGroup aria-label="Filtros ativos">
      {filters.map((filter) => (
        <Tag
          key={filter}
          onRemove={() => setFilters(filters.filter((it) => it !== filter))}
          size="sm"
        >
          {filter}
        </Tag>
      ))}
      <TagToggle onSelectedChange={setOnlyMine} selected={onlyMine} size="sm" tone="accent">
        Somente meus
      </TagToggle>
      <TagButton
        onClick={() => setFilters(['Aberto', 'Prioridade alta', 'Time de plataforma'])}
        size="sm"
        variant="outline"
      >
        Repor
      </TagButton>
    </TagGroup>
  );
}

export const Matrix: Story = {
  parameters: scenario('members'),
  render: () => (
    <main className="slotted-component-lab">
      <LabSection
        description="Five tones over three paintings. Every member reads the same axes, because a chip that acts is the same box as a chip that does not."
        title="Appearance system"
      >
        <div data-slotted-matrix="tag">
          <WorkbenchMatrix
            columns={[...VARIANTS]}
            rows={TONES.map((tone) => ({
              label: tone,
              cells: VARIANTS.map((variant) => (
                <Tag key={variant} tone={tone} variant={variant}>
                  {tone}
                </Tag>
              )),
            }))}
          />
        </div>
      </LabSection>

      <LabSection
        description="A value that does nothing when it is pressed, and can still be removed."
        title="Tag"
      >
        <TagGroup aria-label="Tag" role="list">
          <Tag>Design</Tag>
          <Tag start={GLYPH_TAG} tone="success">
            delivered
          </Tag>
          <Tag onRemove={() => undefined}>Anna Reed</Tag>
          <Tag shape="square" tone="warning" variant="outline">
            in review
          </Tag>
        </TagGroup>
      </LabSection>

      <LabSection
        description="A command, on a real button that is the chip’s body — never the chip itself, so a chip that both acts and removes stays legal HTML."
        title="TagButton"
      >
        <TagGroup aria-label="TagButton">
          <TagButton onClick={() => undefined}>Assign owner</TagButton>
          <TagButton onClick={() => undefined} onRemove={() => undefined} tone="accent">
            Command and remove
          </TagButton>
          <TagButton disabled onClick={() => undefined}>
            Unavailable
          </TagButton>
        </TagGroup>
      </LabSection>

      <LabSection
        description="A destination, on a real anchor, so middle click and “open in new tab” keep working. A router substitutes its own component through render."
        title="TagLink"
      >
        <TagGroup aria-label="TagLink">
          <TagLink href="#equipes">#plataforma</TagLink>
          <TagLink
            href="#equipes"
            render={(props) => <a {...props} data-router-link="true" />}
            tone="accent"
          >
            #produto
          </TagLink>
          <TagLink disabled href="#equipes">
            #arquivado
          </TagLink>
        </TagGroup>
      </LabSection>

      <LabSection
        description="A selection, with both modes and a request that says how it moved. The check grows into the label, so the state is never colour alone."
        title="TagToggle"
      >
        <TagGroup aria-label="TagToggle">
          <TagToggle defaultSelected tone="accent">
            Aberto
          </TagToggle>
          <TagToggle tone="accent">Fechado</TagToggle>
          <TagToggle defaultSelected onRemove={() => undefined} tone="success">
            Delivered
          </TagToggle>
        </TagGroup>
      </LabSection>

      <LabSection
        description="A filter bar: values that leave, a facet that toggles, and a command to put them back — one tab stop, arrow keys inside it."
        title="Composition"
      >
        <Filters />
      </LabSection>
    </main>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      {VARIANTS.map((variant) => (
        <DemoScene
          key={variant}
          label={variant}
          note={
            variant === 'solid'
              ? 'Filled, and its edge is its own fill — except secondary, whose fill is the colour of the page.'
              : variant === 'soft'
                ? 'Tinted, and it keeps the tone’s edge: in high contrast every tone surface becomes the page’s own white.'
                : 'The edge alone.'
          }
        >
          <TagGroup aria-label={variant} role="list">
            {TONES.map((tone) => (
              <Tag key={tone} tone={tone} variant={variant}>
                {tone}
              </Tag>
            ))}
          </TagGroup>
        </DemoScene>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="sizes"
        note="Type, glyph and gap come from the control scale, so a tag shrinks with density beside the controls it sits with. The chip’s height is floored at the WCAG target minimum, which is what keeps the remove control hittable."
      >
        <TagGroup aria-label="Tamanhos" role="list">
          {SIZES.map((size) => (
            <Tag key={size} onRemove={() => undefined} size={size} tone="accent">
              {size}
            </Tag>
          ))}
        </TagGroup>
      </DemoScene>
      <DemoScene label="shapes" note="A rounded chip, or a rectangle with the small radius.">
        <TagGroup aria-label="Formas" role="list">
          <Tag shape="pill">pill</Tag>
          <Tag onRemove={() => undefined} shape="pill" variant="solid">
            pill
          </Tag>
          <Tag shape="square">square</Tag>
          <Tag onRemove={() => undefined} shape="square" variant="solid">
            square
          </Tag>
        </TagGroup>
      </DemoScene>
    </div>
  ),
};

export const Group: Story = {
  parameters: scenario('group'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="toolbar"
        note="One tab stop. Arrow keys move between every control in the run — a chip’s body, then its remove control, then the next chip’s — mirrored in a right-to-left document. Home and End reach the ends."
      >
        <Filters />
      </DemoScene>
      <DemoScene
        label="vertical"
        note="The same run down the block axis, which writes aria-orientation."
      >
        <TagGroup aria-label="Labels" orientation="vertical">
          <Tag onRemove={() => undefined} shape="square" size="sm" tone="success">
            delivered
          </Tag>
          <Tag onRemove={() => undefined} shape="square" size="sm" tone="warning">
            in review
          </Tag>
          <Tag onRemove={() => undefined} shape="square" size="sm" tone="danger">
            blocked
          </Tag>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="list"
        note='Written role="list", the run stops being a widget: no arrow keys, every chip a listitem, and a screen reader announces the length.'
      >
        <TagGroup aria-label="Tecnologias" role="list">
          <Tag>TypeScript</Tag>
          <Tag>Angular</Tag>
          <Tag>React</Tag>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="empty"
        note="A run emptied by a permission filter takes no room at all: the box below sits where the group would have been."
      >
        <div className="slotted-demo-stack">
          <TagGroup aria-label="No filter" />
          <Text tone="muted">No filter applied.</Text>
        </div>
      </DemoScene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="defaults"
        note="An application decides once how its tags are painted and how large they are. An explicit prop still wins; the remove word comes from the language in force."
      >
        <TagDefaultsProvider size="sm" tone="accent">
          <TagGroup aria-label="With defaults">
            <Tag onRemove={() => undefined}>Inherits everything</Tag>
            <Tag onRemove={() => undefined} tone="danger">
              Sobrescreve o tom
            </Tag>
            <Tag onRemove={() => undefined} size="lg">
              Sobrescreve o tamanho
            </Tag>
          </TagGroup>
        </TagDefaultsProvider>
      </DemoScene>
      <DemoScene
        label="in context"
        note="Inside a sentence a tag sits on the text’s centre; inside a list it becomes the list item itself."
      >
        <div className="slotted-demo-stack">
          <Text>
            The <Tag size="sm">March</Tag> delivery is blocked by{' '}
            <Tag size="sm" tone="danger" variant="outline">
              two dependencies
            </Tag>
            .
          </Text>
          <ul style={{ display: 'flex', gap: '0.25rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <Tag render={(props) => <li {...props} />}>TypeScript</Tag>
            <Tag render={(props) => <li {...props} />}>Angular</Tag>
            <Tag render={(props) => <li {...props} />}>React</Tag>
          </ul>
        </div>
      </DemoScene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <DemoScene
        label="the remove control’s name"
        note="Composed, not repeated: a hidden word joined to the tag’s own label by aria-labelledby, so it announces “Remover Ana Reis” rather than “Remover”."
      >
        <TagGroup aria-label="Participantes">
          <Tag messages={{ remove: 'Remover' }} onRemove={() => undefined}>
            Ana Reis
          </Tag>
          <Tag messages={{ remove: 'Remove' }} onRemove={() => undefined}>
            Brian Shaw
          </Tag>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="a value a colour cannot say"
        note="A tone is not a word. What the colour means is written beside it, out of the flow."
      >
        <TagGroup aria-label="Status" role="list">
          <Tag tone="danger" variant="solid">
            SLA
            <VisuallyHidden> overdue</VisuallyHidden>
          </Tag>
          <Tag tone="success" variant="solid">
            SLA
            <VisuallyHidden> dentro do prazo</VisuallyHidden>
          </Tag>
        </TagGroup>
      </DemoScene>
      <DemoScene
        label="keyboard"
        note="Tab reaches the run once. Arrow keys move between its controls, Home and End reach the ends, Backspace or Delete removes the chip focus is inside, and focus lands on the control that took its place."
      >
        <div className="slotted-demo-stack">
          <Heading level={3}>Ordem de foco</Heading>
          <Filters />
          <Text tone="muted">
            After the group, the next Tab continues on the page — never at the top of it.
          </Text>
        </div>
      </DemoScene>
    </div>
  ),
};
