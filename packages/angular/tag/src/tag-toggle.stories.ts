import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTag } from './tag';
import type { TagShape, TagSize, TagTone, TagVariant } from './tag';
import { SlTagBody } from './tag-body';
import { scene, SlTagSelectionDemo } from './tag-demo';
import { SlTagGroup } from './tag-group';
import { SlTagRemove } from './tag-remove';
import { SlTagToggle } from './tag-toggle';
import { ANGULAR_TAG_DOCS, ANGULAR_TAG_TOKENS } from './tag.docs';

interface TagToggleStoryArgs {
  content: string;
  shape: TagShape;
  size: TagSize;
  tone: TagTone;
  variant: TagVariant;
}

const IMPORTS = [SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlTagSelectionDemo, SlTagToggle];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta<TagToggleStoryArgs> = {
  title: 'Components/Tag/TagToggle',
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TagToggle',
        description:
          'A chip that holds a selection. Controlled or uncontrolled, decided once — the half Carbon, Ant, Fluent and Primer all leave to the consumer.',
        framework: 'Angular',
        ...ANGULAR_TAG_DOCS.tagToggle,
        tokens: ANGULAR_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TagToggleStoryArgs>;

export const Playground: Story = {
  args: { content: 'Somente abertos', shape: 'pill', size: 'md', tone: 'accent', variant: 'soft' },
  argTypes: {
    shape: { control: 'inline-radio', options: ['pill', 'square'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'secondary', 'info', 'success', 'warning', 'danger'],
    },
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'dashed'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `<div class="slotted-demo-measure"><div class="slotted-demo-row">
      <span slTag [tone]="tone" [variant]="variant" [size]="size" [shape]="shape">
        <button slTagToggle>{{ content }}</button>
      </span>
    </div></div>`,
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'controlled',
        'The application owns the set. Each chip announces aria-pressed, and the request says whether the pointer or the keyboard moved it.',
        '<sl-tag-selection-demo></sl-tag-selection-demo>',
      )}
      ${scene(
        'uncontrolled',
        'The chip owns its own selection and starts from a value read once. A later change to that value is not silently adopted.',
        `<div slTagGroup aria-label="Preferences">
          <span slTag><button slTagToggle defaultSelected>Notify by email</button></span>
          <span slTag><button slTagToggle>Notify by push</button></span>
          <span slTag disabled><button slTagToggle>Notificar por SMS</button></span>
          <span slTag disabled variant="solid"><button slTagToggle defaultSelected>Digest semanal</button></span>
        </div>`,
      )}
      ${scene(
        'selected and removable',
        'A chosen facet that can also be taken out of the bar. Two controls, two targets, one chip.',
        `<div slTagGroup aria-label="Facetas">
          <span slTag tone="success" removable>
            <button slTagToggle defaultSelected>Delivered</button>
            <button slTagRemove></button>
          </span>
          <span slTag tone="warning" removable>
            <button slTagToggle>In review</button>
            <button slTagRemove></button>
          </span>
        </div>`,
      )}
    </div>`,
  }),
};
