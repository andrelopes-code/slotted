import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTag } from './tag';
import type { TagShape, TagSize, TagTone, TagVariant } from './tag';
import { SlTagBody } from './tag-body';
import { SlTagStart } from './tag-content';
import { glyph, GLYPH_TAG, scene, SlTagRemovalDemo } from './tag-demo';
import { SlTagGroup } from './tag-group';
import { SlTagRemove } from './tag-remove';
import { ANGULAR_TAG_DOCS, ANGULAR_TAG_TOKENS } from './tag.docs';

interface TagStoryArgs {
  content: string;
  shape: TagShape;
  size: TagSize;
  tone: TagTone;
  variant: TagVariant;
}

const IMPORTS = [SlTag, SlTagBody, SlTagGroup, SlTagRemove, SlTagRemovalDemo, SlTagStart];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta<TagStoryArgs> = {
  title: 'Components/Tag',
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tag',
        description:
          'An entity, a filter or a compact value. What the chip is, is which element carries slTagBody: a span does nothing, a button runs a command, an anchor navigates.',
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
  args: { content: 'Design', shape: 'pill', size: 'md', tone: 'secondary', variant: 'soft' },
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
        <span slTagBody>{{ content }}</span>
      </span>
    </div></div>`,
  }),
};

export const Removal: Story = {
  parameters: scenario('removal'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'removal',
        'The X, and Backspace or Delete on the chip. Focus goes to the control that took the removed one’s place, then to the last one, then to the group itself.',
        '<sl-tag-removal-demo></sl-tag-removal-demo>',
      )}
      ${scene(
        'refused',
        'A removal is a request. Refusing it leaves the chip and the keyboard where they were.',
        `<div slTagGroup aria-label="Protected tags">
          <span slTag removable tone="danger" variant="outline" (remove)="$event.cancel()">
            <span slTagBody>Production</span>
            <button slTagRemove></button>
          </span>
          <span slTag removable removeDisabled>
            <span slTagBody>Somente leitura</span>
            <button slTagRemove></button>
          </span>
        </div>`,
      )}
    </div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'long',
        'One line, clipped with an ellipsis. The whole value stays in the DOM, in the accessibility tree, and findable by page search.',
        `<div style="max-inline-size: 18rem">
          <div slTagGroup aria-label="Long values">
            <span slTag removable>
              <span slTagBody>Pending approval requests at the regional directorate</span>
              <button slTagRemove></button>
            </span>
            <span slTag variant="outline">
              <span slTagBody>Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz</span>
            </span>
          </div>
        </div>`,
      )}
      ${scene(
        'glyphs',
        'A glyph before or after the words, in a box the family sizes and centers. The artwork is the consumer’s.',
        `<div slTagGroup role="list" aria-label="Com glifos">
          <span slTag tone="accent">
            <span slTagBody><span slTagStart>${glyph(GLYPH_TAG)}</span>entidade</span>
          </span>
          <span slTag tone="success" removable>
            <span slTagBody><span slTagStart>${glyph(GLYPH_TAG)}</span>delivered</span>
            <button slTagRemove></button>
          </span>
          <span slTag tone="warning" variant="outline" shape="square">
            <span slTagBody>in review</span>
          </span>
        </div>`,
      )}
      ${scene(
        'direction',
        'The label is a bidi isolate: its direction comes from its own first strong character, not from the page.',
        `<div slTagGroup role="list" aria-label="Direction">
          <span slTag><span slTagBody>مرحبا</span></span>
          <span slTag><span slTagBody>#platform</span></span>
          <span slTag removable>
            <span slTagBody>עברית</span>
            <button slTagRemove></button>
          </span>
        </div>`,
      )}
    </div>`,
  }),
};
