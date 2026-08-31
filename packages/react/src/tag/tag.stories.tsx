import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Tag } from './tag';
import { REACT_TAG_DOCS, REACT_TAG_TOKENS } from './tag.docs';
import { TagRemove } from './tag-remove';
import type { TagFill, TagVariant } from './tag.types';

const VARIANTS: readonly TagVariant[] = ['accent', 'secondary', 'success', 'warning', 'danger'];
const FILLS: readonly TagFill[] = ['solid', 'outline', 'subtle'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tag',
        description: 'A short value the reader can take back out.',
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
  args: { children: 'Design', fill: 'subtle', size: 'md', variant: 'accent' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Tag {...args} />
      </div>
    </div>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {FILLS.map((fill) => (
        <section className="slotted-demo-scene" key={fill}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{fill}</span>
            <span className="slotted-demo-scene__note">
              The five tones the library names, in one fill.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              {VARIANTS.map((variant) => (
                <Tag fill={fill} key={variant} variant={variant}>
                  {variant}
                  <TagRemove aria-label={`Remove ${variant}`} />
                </Tag>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

function RemovableList() {
  const [values, setValues] = useState(['Design', 'Research', 'Accessibility']);

  return (
    <div className="slotted-demo-stack">
      <ul className="slotted-demo-row" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {values.map((value) => (
          <li key={value}>
            <Tag fill="subtle" variant="accent">
              {value}
              <TagRemove
                aria-label={`Remove ${value}`}
                onClick={() => setValues((current) => current.filter((item) => item !== value))}
              />
            </Tag>
          </li>
        ))}
      </ul>
      {values.length === 0 ? <p>Every tag has been removed.</p> : null}
    </div>
  );
}

export const Removable: Story = {
  parameters: scenario('removable'),
  render: () => (
    <div className="slotted-demo-measure">
      <RemovableList />
      <p>
        The list is a ul of li elements: the tags are values, and only the page knows they are a
        list. Each remove control names the value it removes, so three controls do not all read
        &ldquo;Remove&rdquo;.
      </p>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <div className="slotted-demo-row">
          <Tag fill="outline" size="sm" variant="secondary">
            Read only
          </Tag>
          <Tag fill="subtle" size="sm" variant="warning">
            Expiring
            <TagRemove aria-label="Remove expiring" disabled />
          </Tag>
          <Tag fill="solid" size="sm" variant="danger">
            Blocked
            <TagRemove aria-label="Remove blocked" />
          </Tag>
        </div>
        <p>
          A tag with no remove control is just a value. A disabled control stays visible and leaves
          the tab order, which says the value exists and cannot be taken back out.
        </p>
      </div>
    </div>
  ),
};
