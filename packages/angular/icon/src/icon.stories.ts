import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideChevronRight,
  lucideCircleCheck,
  lucideClock,
  lucideDownload,
  lucideInfo,
  lucideSearch,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { GLYPHS } from '@slotted/core/glyph';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlGlyph } from './glyph';
import { SlIcon } from './icon';
import { ANGULAR_ICON_DOCS, ANGULAR_ICON_TOKENS } from './icon.docs';
import type { IconSize, IconTone } from './icon.types';

interface IconStoryArgs {
  directional: boolean;
  size: IconSize;
  tone: IconTone;
}

const SIZES: readonly IconSize[] = ['sm', 'md', 'lg'];
const TONES: readonly IconTone[] = [
  'inherit',
  'default',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
];

/**
 * `inherit` paints nothing, so listing it as a swatch beside `default` produces
 * two identical rows and proves nothing. It gets a scene of its own instead.
 */
const PAINTED_TONES = TONES.filter((tone) => tone !== 'inherit');

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<IconStoryArgs> = {
  title: 'Components/Icon',
  component: SlIcon,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlGlyph, SlIcon],
      providers: [
        provideIcons({
          lucideArrowRight,
          lucideChevronRight,
          lucideCircleCheck,
          lucideClock,
          lucideDownload,
          lucideInfo,
          lucideSearch,
          lucideTriangleAlert,
        }),
      ],
    }),
  ],
  argTypes: {
    size: { control: 'select', options: ['text', 'sm', 'md', 'lg'] },
    tone: { control: 'select', options: [...TONES, 'inverse'] },
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Icon',
        description: 'The box a glyph is drawn in. The artwork stays yours.',
        framework: 'Angular',
        ...ANGULAR_ICON_DOCS.icon,
        tokens: ANGULAR_ICON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<IconStoryArgs>;

export const Playground: Story = {
  args: { directional: false, size: 'md', tone: 'inherit' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <span class="slotted-demo-row">
    <span slIcon [size]="size" [tone]="tone" [directional]="directional">
      <ng-icon name="lucideSearch" />
    </span>
    Search the ledger
  </span>
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Four steps</span>
      <span class="slotted-demo-scene__note">
        Three read the control icon scale, so they shrink with density exactly as the control beside
        them does. The fourth follows the type, because a control-sized glyph inside a display
        heading is not an icon. Change the density in the toolbar to see the first three move and
        the fourth stay.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <span class="slotted-demo-row">
          ${SIZES.map(
            (size) =>
              `<span class="slotted-demo-row">
            <span slIcon size="${size}"><ng-icon name="lucideCircleCheck" /></span>
            ${size}
          </span>`,
          ).join('\n          ')}
        </span>
        <span style="font-size: var(--slotted-font-size-3xl); font-weight: 600">
          <span slIcon size="text"><ng-icon name="lucideCircleCheck" /></span>
          text — follows the type
        </span>
        <span style="font-size: var(--slotted-font-size-xs)">
          <span slIcon size="text"><ng-icon name="lucideCircleCheck" /></span>
          text — and follows it down again
        </span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Baseline: Story = {
  parameters: scenario('baseline'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Sitting on the line</span>
      <span class="slotted-demo-scene__note">
        Every other scene here lays its icons out with flexbox, where the parent decides alignment
        and the family’s optical shift is inert. This one is running text, which is the only place
        the shift does anything: the box would otherwise sit with its bottom edge on the baseline
        and read high beside lower-case letters.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div class="slotted-demo-measure">
        <p style="margin: 0">
          Running text with an icon
          <span slIcon size="text"><ng-icon name="lucideInfo" /></span>
          set at the size of the type, and one
          <span slIcon><ng-icon name="lucideInfo" /></span>
          set from the control scale, so the shift can be judged against a real line rather than
          against a single word.
        </p>
        <p style="margin-block-end: 0">
          The same at the smallest step
          <span slIcon size="sm"><ng-icon name="lucideInfo" /></span>
          where half a pixel is visible.
        </p>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Color</span>
      <span class="slotted-demo-scene__note">
        The default is inherit, so an icon beside a label is the color of that label without anyone
        deciding it. The family sets color and never fill or stroke: stroked and filled artwork
        both read currentColor, and imposing either would break the other.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        ${PAINTED_TONES.map(
          (tone) =>
            `<span class="slotted-demo-row">
          <span slIcon tone="${tone}"><ng-icon name="lucideInfo" /></span>
          ${tone}
        </span>`,
        ).join('\n        ')}
        <span
          class="slotted-demo-row"
          style="
            background: var(--slotted-tone-warning-surface);
            border-radius: var(--slotted-radius-md);
            color: var(--slotted-tone-warning-text);
            padding: var(--slotted-space-4);
          "
        >
          <span slIcon><ng-icon name="lucideInfo" /></span>
          inherit — no tone asked for, and the callout’s color taken
        </span>
        <span
          class="slotted-demo-row"
          style="
            background: var(--slotted-surface-inverse);
            border-radius: var(--slotted-radius-md);
            color: var(--slotted-text-inverse);
            padding: var(--slotted-space-4);
          "
        >
          <span slIcon tone="inverse"><ng-icon name="lucideInfo" /></span>
          inverse, on an inverted surface
        </span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const InContext: Story = {
  parameters: scenario('in-context'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Sized by what contains it</span>
      <span class="slotted-demo-scene__note">
        A container sets --slotted-icon-size once and every icon inside it follows, which is how a
        rebuilt Button will size its icons without knowing this family’s API. An instance that
        states its own size wins over the container.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div
        class="slotted-demo-stack"
        style="--slotted-icon-size: var(--slotted-control-icon-size-sm)"
      >
        <span class="slotted-demo-row">
          <span slIcon tone="muted"><ng-icon name="lucideClock" /></span>
          A row whose container set the icon size once
        </span>
        <span class="slotted-demo-row">
          <span slIcon tone="accent" size="lg"><ng-icon name="lucideClock" /></span>
          And one instance that overrode it
        </span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Direction: Story = {
  parameters: scenario('direction'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Mirroring</span>
      <span class="slotted-demo-scene__note">
        Turn direction to rtl in the toolbar. The arrow and the chevron mirror because they were
        declared directional; the clock does not, because a mirrored clock runs backwards.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <span class="slotted-demo-row">
          <span slIcon directional><ng-icon name="lucideArrowRight" /></span>
          directional — an arrow points at the next thing, whichever way reading runs
        </span>
        <span class="slotted-demo-row">
          <span slIcon directional><ng-icon name="lucideChevronRight" /></span>
          directional — a chevron opens the same way
        </span>
        <span class="slotted-demo-row">
          <span slIcon><ng-icon name="lucideClock" /></span>
          neutral — a clock mirrored is a clock that runs backwards
        </span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Named, or hidden</span>
      <span class="slotted-demo-scene__note">
        There is no decorative input: an icon with no name is hidden from the accessibility tree,
        and an icon with one takes role=img and carries it. Run the a11y panel on this story.
      </span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <span class="slotted-demo-row">
          <span slIcon tone="success"><ng-icon name="lucideCircleCheck" /></span>
          Paid — the icon repeats the word, so it stays out of the tree
        </span>
        <span class="slotted-demo-row">
          Invoice 4021
          <span slIcon label="Payment failed" tone="danger">
            <ng-icon name="lucideTriangleAlert" />
          </span>
          nothing beside it says the payment failed, so the icon says it
        </span>
        <span class="slotted-demo-row">
          Export 4021
          <span slIcon aria-label="Export ready" tone="accent">
            <ng-icon name="lucideDownload" />
          </span>
          a name written as aria-label counts the same, and is not hidden
        </span>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const LibraryGlyphs: Story = {
  parameters: scenario('library-glyphs'),
  render: () => ({
    props: { names: Object.keys(GLYPHS) },
    template: `
      <div class="slotted-demo-grid" data-columns="1">
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">The library’s own icons</span>
            <span class="slotted-demo-scene__note">
              Every icon a family draws for itself — a close button’s cross, a pager’s chevrons — is
              one of these, a real svg inside the icon box.
            </span>
          </header>
          <div class="slotted-demo-stage">
            <div class="slotted-demo-grid" data-columns="4">
              @for (name of names; track name) {
                <span class="slotted-demo-row"><span slIcon><svg slGlyph [name]="name"></svg></span>{{ name }}</span>
              }
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};
