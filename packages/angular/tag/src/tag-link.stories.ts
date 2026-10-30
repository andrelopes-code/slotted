import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlVisuallyHidden } from '../../visually-hidden/src/visually-hidden';
import { SlTag } from './tag';
import type { TagShape, TagSize, TagTone, TagVariant } from './tag';
import { SlTagBody } from './tag-body';
import { scene } from './tag-demo';
import { SlTagGroup } from './tag-group';
import { SlTagRemove } from './tag-remove';
import { ANGULAR_TAG_DOCS, ANGULAR_TAG_TOKENS } from './tag.docs';

interface TagLinkStoryArgs {
  content: string;
  shape: TagShape;
  size: TagSize;
  tone: TagTone;
  variant: TagVariant;
}

const IMPORTS = [SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlVisuallyHidden];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta<TagLinkStoryArgs> = {
  title: 'Components/Tag/TagLink',
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'TagLink',
        description:
          'A chip that navigates: slTagBody on the consumer’s own anchor, so routerLink composes on the same element and the platform keeps middle click, the context menu and “open in new tab”.',
        framework: 'Angular',
        ...ANGULAR_TAG_DOCS.tagLink,
        tokens: ANGULAR_TAG_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TagLinkStoryArgs>;

export const Playground: Story = {
  args: { content: '#plataforma', shape: 'pill', size: 'md', tone: 'accent', variant: 'soft' },
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
        <a slTagBody href="#tag-link-playground">{{ content }}</a>
      </span>
    </div></div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'destinations',
        'A destination the browser owns, one that also removes, and one that leaves the origin.',
        `<div slTagGroup aria-label="Destinos">
          <span slTag><a slTagBody href="#equipes">#plataforma</a></span>
          <span slTag tone="accent" removable>
            <a slTagBody href="#equipes">#produto</a>
            <button slTagRemove></button>
          </span>
          <span slTag>
            <a slTagBody href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noreferrer">
              APG<span slVisuallyHidden> (abre em nova aba)</span>
            </a>
          </span>
        </div>`,
      )}
      ${scene(
        'unavailable',
        'A chip that cannot be followed withholds its href and keeps its place in the tab sequence, so it can still explain itself. The attribute is given back the moment the chip becomes available again.',
        `<div slTagGroup aria-label="Unavailable">
          <span slTag disabled><a slTagBody href="#teams">#archived</a></span>
          <span slTag disabled variant="outline" removable>
            <a slTagBody href="#equipes">#encerrado</a>
            <button slTagRemove></button>
          </span>
        </div>`,
      )}
    </div>`,
  }),
};
