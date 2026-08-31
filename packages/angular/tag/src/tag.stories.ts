import { signal } from '@angular/core';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTag } from './tag';
import type { TagFill, TagSize, TagVariant } from './tag';
import { ANGULAR_TAG_DOCS, ANGULAR_TAG_TOKENS } from './tag.docs';
import { SlTagRemove } from './tag-remove';

interface TagStoryArgs {
  content: string;
  fill: TagFill;
  size: TagSize;
  variant: TagVariant;
}

const VARIANTS = ['accent', 'secondary', 'success', 'warning', 'danger'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta: Meta<TagStoryArgs> = {
  title: 'Components/Tag',
  component: SlTag,
  decorators: [moduleMetadata({ imports: [SlTag, SlTagRemove] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tag',
        description: 'A short value the reader can take back out.',
        framework: 'Angular',
        ...ANGULAR_TAG_DOCS.tag,
        tokens: ANGULAR_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TagStoryArgs>;

export const Playground: Story = {
  args: { content: 'Design', fill: 'subtle', size: 'md', variant: 'accent' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slTag [fill]="fill" [size]="size" [variant]="variant">{{ content }}</span>
  </div>
</div>`,
  }),
};

const fillScene = (fill: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${fill}</span>
      <span class="slotted-demo-scene__note">The five tones the library names, in one fill.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        ${VARIANTS.map(
          (variant) =>
            `<span slTag fill="${fill}" variant="${variant}">${variant}<button slTagRemove aria-label="Remove ${variant}"></button></span>`,
        ).join('\n        ')}
      </div>
    </div>
  </section>`;

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${fillScene('solid')}
  ${fillScene('outline')}
  ${fillScene('subtle')}
</div>`,
  }),
};

export const Removable: Story = {
  parameters: scenario('removable'),
  render: () => {
    const values = signal(['Design', 'Research', 'Accessibility']);
    return {
      props: {
        values,
        remove: (value: string) => values.update((current) => current.filter((v) => v !== value)),
      },
      template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <ul class="slotted-demo-row" style="list-style: none; margin: 0; padding: 0">
      @for (value of values(); track value) {
        <li>
          <span slTag fill="subtle" variant="accent">
            {{ value }}
            <button slTagRemove [attr.aria-label]="'Remove ' + value" (click)="remove(value)"></button>
          </span>
        </li>
      }
    </ul>
    @if (values().length === 0) {
      <p>Every tag has been removed.</p>
    }
  </div>
  <p>
    The list is a ul of li elements: the tags are values, and only the page knows they are a list.
    Each remove control names the value it removes, so three controls do not all read
    &ldquo;Remove&rdquo;.
  </p>
</div>`,
    };
  },
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div class="slotted-demo-row">
      <span slTag fill="outline" size="sm" variant="secondary">Read only</span>
      <span slTag fill="subtle" size="sm" variant="warning">
        Expiring
        <button slTagRemove disabled aria-label="Remove expiring"></button>
      </span>
      <span slTag fill="solid" size="sm" variant="danger">
        Blocked
        <button slTagRemove aria-label="Remove blocked"></button>
      </span>
    </div>
    <p>
      A tag with no remove control is just a value. A disabled control stays visible and leaves the
      tab order, which says the value exists and cannot be taken back out.
    </p>
  </div>
</div>`,
  }),
};
