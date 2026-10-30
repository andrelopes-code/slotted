import { isolated, bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';

import { SlTooltip } from './tooltip';
import { provideTooltipDefaults } from './tooltip-defaults';
import {
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from './tooltip-parts';
import { ANGULAR_TOOLTIP_DOCS, ANGULAR_TOOLTIP_TOKENS } from './tooltip.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TOOLTIP_DOCS.tooltip.scenes, {
    playground: Playground,
    variant: Variant,
    sizes: Sizes,
    placement: Placement,
    delay: Delay,
    describes: Describes,
    hoverable: Hoverable,
    content: Content,
    disabled: Disabled,
    composition: Composition,
    keyboard: Keyboard,
  });

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story composes these
 * rather than laying itself out, so no story reaches for an inline style.
 */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="stack">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/**
 * The ground every demonstration opens inside. A tooltip is portalled to the
 * end of the document by default, which is right in an application and wrong on
 * a page of stacked scenes: a layer opened in one would draw over the one above
 * it. `contain: paint` on this box makes it the containing block for the layer
 * and clips it to the scene, and every demonstration but `composition` pairs it
 * with `[portal]="false"`.
 */
const viewport = (body: string, ground: 'page' | 'inverse' = 'page') =>
  `<div class="slotted-demo-viewport${ground === 'inverse' ? ' slotted-demo-surface' : ''}" data-place="center" data-size="layer"${
    ground === 'inverse' ? ' data-surface="inverse"' : ''
  }><div class="slotted-demo-row">${body}</div></div>`;

const hint = (attributes: string, label: string, text: string) => `
  <ng-container slTooltip [portal]="false" ${attributes}>
    <button slButton tone="secondary" variant="outline" slTooltipTrigger type="button">${label}</button>
    <ng-template slTooltipLayer>
      <div slTooltipContent>${text}</div>
      <div slTooltipArrow></div>
    </ng-template>
  </ng-container>`;

const meta: Meta<SlTooltip> = {
  title: 'Components/Tooltip',
  component: SlTooltip,
  decorators: [
    moduleMetadata({
      imports: [
        SlButton,
        SlTooltip,
        SlTooltipTrigger,
        SlTooltipLayer,
        SlTooltipContent,
        SlTooltipArrow,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        ...ANGULAR_TOOLTIP_DOCS.tooltip,
        description:
          'A short, non-interactive sentence about the element under the pointer or under focus. It never takes focus and never holds a control — the APG names the non-modal dialog for that, which is slPopover.',
        framework: 'Angular',
        scenes: referenceScenes,
        title: 'Tooltip',
        tokens: ANGULAR_TOOLTIP_TOKENS,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SlTooltip>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_, context) => ({
    props: { open: isolated(context) },
    template: grid(
      1,
      scene(
        'Hover, or Tab',
        'The pointer waits out the 600 ms warmup; keyboard focus opens it in the same task, because a delay a reader cannot shorten by moving faster is a delay for nothing.',
        viewport(
          hint(
            'side="bottom" [open]="open"',
            'Publish',
            'Sends the draft to every subscriber on the list',
          ),
        ),
      ),
    ),
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: (_, context) => ({
    props: { open: isolated(context) },
    template: grid(
      2,
      scene(
        'Inverse, on the page',
        'A surface opposite to the page separates itself in every scheme without an edge, which is why it is the default and carries no border at all.',
        viewport(
          hint('side="bottom" [open]="open"', 'Inverse', 'Opposite to the page, in every scheme'),
        ),
      ) +
        scene(
          'Surface, on a dark ground',
          'On a page that is already dark the inverse hint is the brightest thing on it. The raised surface takes a hairline instead, and the arrow outline continues it.',
          viewport(
            `<ng-container slTooltip [portal]="false" side="bottom" variant="surface" [open]="open">
               <button slButton tone="accent" slTooltipTrigger type="button">Surface</button>
               <ng-template slTooltipLayer>
                 <div slTooltipContent>Reads as a small panel rather than as a label</div>
                 <div slTooltipArrow></div>
               </ng-template>
             </ng-container>`,
            'inverse',
          ),
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: (_, context) => ({
    props: { open: isolated(context) },
    template: grid(
      1,
      scene(
        'Small, and medium',
        'Twelve pixels and thirteen. Switch the density in the toolbar: both tighten their padding and neither changes what it means, because both read the control scales.',
        viewport(
          hint(
            'side="bottom" size="sm" [open]="open"',
            'Small',
            'Twelve pixels, in a row that has no room',
          ) +
            hint(
              'side="bottom" size="md" [open]="open"',
              'Medium',
              'Thirteen pixels, everywhere else',
            ),
        ),
      ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The four physical sides',
        'Each button asks for one edge. Narrow the window until one collides and it flips to the opposite side, then slides along it rather than leaving the screen.',
        viewport(
          hint('side="top"', 'top', 'Above') +
            hint('side="bottom"', 'bottom', 'Below') +
            hint('side="left"', 'left', 'Physical left') +
            hint('side="right"', 'right', 'Physical right'),
        ),
      ) +
        scene(
          'The two logical sides',
          'Switch the toolbar to rtl: these two swap and the physical pair above does not. No surveyed library but Base UI offers them, in a repository whose layout law is logical properties.',
          viewport(
            hint('side="inline-start"', 'inline-start', 'Mirrors with the direction') +
              hint('side="inline-end"', 'inline-end', 'And so does this one'),
          ),
        ),
    ),
  }),
};

export const Delay: Story = {
  parameters: scenario('delay'),
  decorators: [
    applicationConfig({ providers: [provideTooltipDefaults({ groupDelay: 400, openDelay: 600 })] }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'The warmup, and the window after it',
        'Cross the row quickly and nothing opens. Rest on one until it opens, then move to its neighbour: the second arrives with no delay, because the group window starts when the first one closes.',
        viewport(
          hint('side="bottom"', 'Duplicate', 'Copy the row') +
            hint('side="bottom"', 'Archive', 'Move it out of the list') +
            hint('side="bottom"', 'Delete', 'Remove it for good'),
        ),
      ),
    ),
  }),
};

export const Describes: Story = {
  parameters: scenario('describes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A description, on a labelled control',
        'The button already says what it does; the hint adds a sentence about it, and the trigger points at it with aria-describedby only while it is open.',
        viewport(hint('side="bottom"', 'Publish', 'Publishing cannot be undone from here')),
      ) +
        scene(
          'A name, on a control that has none',
          'An icon-only button described by its tooltip and named by nothing is announced as “button”. Under label the hint is the name, so the layer is in the document before anyone opens it.',
          viewport(`
            <ng-container slTooltip describes="label" [portal]="false" side="bottom">
              <button slButton tone="secondary" variant="outline" slTooltipTrigger type="button">+</button>
              <ng-template slTooltipLayer>
                <div slTooltipContent>Add a row</div>
                <div slTooltipArrow></div>
              </ng-template>
            </ng-container>`),
        ),
    ),
  }),
};

export const Hoverable: Story = {
  parameters: scenario('hoverable'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The pointer can land on it',
        'Open it and move the pointer onto the hint: it stays. The distance between the button and the surface is the layer own padding, so the pointer never crosses empty page — SC 1.4.13 Hoverable.',
        viewport(hint('side="bottom"', 'Hoverable', 'Move the pointer onto me')),
      ) +
        scene(
          'The pointer passes straight through',
          '[hoverable]="false" takes the layer out of the pointer way entirely, for a hint over something the reader has to keep clicking. It is a criterion before it is an option, so switching it off is a decision.',
          viewport(
            hint(
              'side="bottom" [hoverable]="false"',
              'Not hoverable',
              'Nothing here takes the pointer',
            ),
          ),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: (_, context) => ({
    props: { open: isolated(context) },
    template: grid(
      3,
      scene(
        'Long enough to meet the measure',
        'The cap is a family token rather than an axis, because measure belongs to Container and to it alone. Past it the sentence wraps instead of setting one line the width of the page.',
        viewport(
          hint(
            'side="bottom" [open]="open"',
            'Long',
            'Publishing sends the draft to every subscriber on the list and cannot be undone from here.',
          ),
        ),
      ) +
        scene(
          'One unbroken token',
          'overflow-wrap: anywhere breaks it rather than letting it run past the measure. A hostile string is a string with no spaces in it.',
          viewport(
            hint(
              'side="bottom" [open]="open"',
              'Unbroken',
              'webhook_delivery_failure_retry_backoff_seconds',
            ),
          ),
        ) +
        scene(
          'Another script',
          'unicode-bidi: plaintext takes each paragraph direction from its own first strong character, so an Arabic hint reads right to left on this page and an English one reads left to right on an Arabic page.',
          viewport(
            hint(
              'side="bottom" [open]="open"',
              'Translated',
              'يحفظ المسودة دون نشرها على أي قائمة بريدية',
            ),
          ),
        ),
    ),
  }),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => ({
    template: grid(
      2,
      scene(
        'aria-disabled, which still reports the pointer',
        'A control the page disabled with the native attribute fires no pointer events, so the one explanation of why it is disabled is the one nobody can reach. This shape keeps it focusable and reachable.',
        viewport(`
          <ng-container slTooltip [portal]="false" side="bottom">
            <button aria-disabled="true" slButton tone="secondary" variant="outline" slTooltipTrigger type="button">Publish</button>
            <ng-template slTooltipLayer>
              <div slTooltipContent>Publish once the invoice has a customer</div>
              <div slTooltipArrow></div>
            </ng-template>
          </ng-container>`),
      ) +
        scene(
          'The family switched off',
          'disabled on the slTooltip itself is a different thing: no layer is created at all, and the trigger never gets data-open. It is a configuration rather than a state, so nothing is painted for it.',
          viewport(hint('side="bottom" disabled', 'Nothing opens', 'This never appears')),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideTooltipDefaults({ describes: 'label', openDelay: 400, size: 'sm' })],
    }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'A row of icon buttons, portalled as it would be in an application',
        'These keep the default portal, so each layer is rendered at the end of the document and inherits the theme, scheme, density and direction of the region it was opened from. One provider names the hint and the delays for the whole row.',
        viewport(`
          <ng-container slTooltip side="bottom">
            <button slButton size="sm" tone="secondary" variant="ghost" slTooltipTrigger type="button">↧</button>
            <ng-template slTooltipLayer>
              <div slTooltipContent>Download</div>
              <div slTooltipArrow></div>
            </ng-template>
          </ng-container>
          <ng-container slTooltip side="bottom">
            <button slButton size="sm" tone="secondary" variant="ghost" slTooltipTrigger type="button">⧉</button>
            <ng-template slTooltipLayer>
              <div slTooltipContent>Duplicate</div>
              <div slTooltipArrow></div>
            </ng-template>
          </ng-container>
          <ng-container slTooltip side="bottom">
            <button slButton size="sm" tone="danger" variant="ghost" slTooltipTrigger type="button">✕</button>
            <ng-template slTooltipLayer>
              <div slTooltipContent>Delete</div>
              <div slTooltipArrow></div>
            </ng-template>
          </ng-container>`),
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { reason: '—' },
    template: grid(
      1,
      scene(
        'Every key, and the reason it carries',
        'Tab in and the hint opens without a delay. Escape dismisses it and the focus stays on the button. Enter activates the button and clears the hint away. The last reason the family emitted is printed under the row.',
        `${viewport(`
          <ng-container slTooltip [portal]="false" side="bottom" (openChangeRequest)="reason = $event.reason">
            <button slButton tone="secondary" variant="outline" slTooltipTrigger type="button">Tab to me</button>
            <ng-template slTooltipLayer>
              <div slTooltipContent>Escape dismisses without moving the focus</div>
              <div slTooltipArrow></div>
            </ng-template>
          </ng-container>`)}
        <div class="slotted-demo-rows"><span>Last reason</span><span>{{ reason }}</span></div>`,
      ),
    ),
  }),
};
