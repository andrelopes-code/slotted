import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlButton } from '@slotted/angular/button';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlToolbar } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCollapsible } from './collapsible';
import type {
  CollapsibleIndicator,
  CollapsibleLevel,
  CollapsibleMount,
  CollapsibleSize,
  CollapsibleTogglePlacement,
  CollapsibleVariant,
} from './collapsible-defaults';
import {
  SlCollapsibleActions,
  SlCollapsibleContent,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from './collapsible-parts';
import { ANGULAR_COLLAPSIBLE_DOCS, ANGULAR_COLLAPSIBLE_TOKENS } from './collapsible.docs';

interface CollapsibleStoryArgs {
  disabled: boolean;
  indicator: CollapsibleIndicator;
  level: CollapsibleLevel;
  loading: boolean;
  mount: CollapsibleMount;
  open: boolean;
  size: CollapsibleSize;
  togglePlacement: CollapsibleTogglePlacement;
  truncate: boolean;
  variant: CollapsibleVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_COLLAPSIBLE_DOCS.collapsible.scenes, {
    playground: Playground,
    variant: Variant,
    sizes: Sizes,
    indicator: Indicator,
    heading: Heading,
    description: Description,
    actions: Actions,
    mount: Mount,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<CollapsibleStoryArgs> = {
  title: 'Components/Collapsible',
  decorators: [
    moduleMetadata({
      imports: [
        SlCollapsible,
        SlCollapsibleHeader,
        SlCollapsibleTrigger,
        SlCollapsibleActions,
        SlCollapsiblePanel,
        SlCollapsibleContent,
        SlText,
        SlButton,
        SlToolbar,
        SlSkeleton,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Collapsible',
        description:
          'One disclosure: a header the reader operates and a panel it controls. The platform’s own keyboard, a panel that opens to its own height without being measured, and a page search that opens what it found.',
        framework: 'Angular',
        ...ANGULAR_COLLAPSIBLE_DOCS.collapsible,
        tokens: ANGULAR_COLLAPSIBLE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CollapsibleStoryArgs>;

const address = (attributes = '', title = 'Delivery address') =>
  `<div slCollapsible ${attributes}>
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>${title}</button></h3>
    <div slCollapsiblePanel>
      <p slText size="sm">Rua das Laranjeiras, 402 — Rio de Janeiro.</p>
    </div>
  </div>`;

const scene = (label: string, note: string, body: string, layout = 'block') =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${scenes}</div>`;

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    indicator: 'chevron',
    level: 'none',
    loading: false,
    mount: 'eager',
    open: true,
    size: 'md',
    togglePlacement: 'end',
    truncate: false,
    variant: 'plain',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `<div class="slotted-demo-stage" data-layout="block">
      <div
        slCollapsible
        [open]="open"
        [size]="size"
        [variant]="variant"
        [indicator]="indicator"
        [togglePlacement]="togglePlacement"
        [level]="level"
        [mount]="mount"
        [truncate]="truncate"
        [disabled]="disabled"
        [loading]="loading"
      >
        <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery address</button></h3>
        <div slCollapsiblePanel>
          <p slText size="sm">402 Maple Street — Seattle.</p>
        </div>
      </div>
    </div>`,
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: grid(
      3,
      scene(
        'plain',
        'No chrome at all: the words, the mark and the panel, with nothing drawn around them. It is the disclosure that sits inside a paragraph of settings.',
        address('variant="plain" [open]="true"', 'Payment methods'),
      ) +
        scene(
          'ruled',
          'A hairline above the header. It is what makes a stack of them read as one list, and the set below closes the stack with a rule of its own.',
          address('variant="ruled" [open]="true"', 'Payment methods'),
        ) +
        scene(
          'framed',
          'Its own card: a border, a radius and a raised surface, with the hover fill clipped to the corner the frame drew.',
          address('variant="framed" [open]="true"', 'Payment methods'),
        ),
    ),
  }),
};

const summary = (attributes: string) =>
  `<div slCollapsible variant="framed" [open]="true" ${attributes}>
    <h3 slCollapsibleHeader>
      <button slCollapsibleTrigger description="3 de 12 itens">Resumo</button>
    </h3>
    <div slCollapsiblePanel>
      <p slText size="sm">Delivery scheduled for September 12.</p>
    </div>
  </div>`;

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      3,
      scene(
        'sm',
        'The compact step, for a disclosure inside a card or above a dense table. The title stays larger than a control label, because it is a heading.',
        summary('size="sm"'),
      ) +
        scene(
          'md',
          'The default. Title on the type scale, row height and padding on the control scales, so switching the toolbar to dense tightens it rather than shrinking it.',
          summary('size="md"'),
        ) +
        scene(
          'lg',
          'The step for a section header a page is organized by. The second line steps with it, so the pair keeps its relationship at every size.',
          summary('size="lg"'),
        ),
    ),
  }),
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The chevron turns',
        'Down when closed and up when open, so the same artwork is right in a right-to-left document — nothing is mirrored, because nothing points along the inline axis.',
        address('variant="ruled"', 'Invoice') + address('variant="ruled" [open]="true"', 'Invoice'),
      ) +
        scene(
          'plus-minus, and the start edge',
          'One pair drawn on one grid: the same bar, with a second crossing it. At the start edge the panel’s text is indented to line up with the title rather than with the mark.',
          address('variant="ruled" indicator="plus-minus"', 'Invoice') +
            address('variant="ruled" togglePlacement="start" [open]="true"', 'Invoice') +
            address('variant="ruled" indicator="none"', 'Invoice, no mark'),
        ),
    ),
  }),
};

export const Heading: Story = {
  parameters: scenario('heading'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A native heading, left alone',
        'The consumer wrote an h3 and the directive adds nothing to it: no role, no aria-level, because the platform already says both.',
        address('variant="framed"', 'Return conditions'),
      ) +
        scene(
          'Anything else, given the role',
          'A div carrying slCollapsibleHeader is given role="heading" and the resolved aria-level, which is the alternative the pattern itself names.',
          `<div slCollapsible variant="framed" level="3">
            <div slCollapsibleHeader><button slCollapsibleTrigger>Advanced options</button></div>
            <div slCollapsiblePanel><p slText size="sm">Thirty calendar days.</p></div>
          </div>`,
        ),
    ),
  }),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A summary that stays visible',
        'The second line is inside the trigger, so a reader hears “Regras de frete, 2 regras ativas” as one name rather than meeting two controls.',
        `<div slCollapsible variant="framed">
          <h3 slCollapsibleHeader>
            <button slCollapsibleTrigger description="2 regras ativas">Regras de frete</button>
          </h3>
          <div slCollapsiblePanel>
            <p slText size="sm">Free shipping over $250.00 for the Southeast region.</p>
          </div>
        </div>`,
      ) +
        scene(
          'The same pair, open',
          'The mark is centerd on the two lines rather than on the title alone, so the row reads as one block whatever the second line says.',
          `<div slCollapsible variant="framed" [open]="true">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger description="2 regras ativas">Regras de frete</button>
            </h3>
            <div slCollapsiblePanel>
              <p slText size="sm">Free shipping over $250.00 for the Southeast region.</p>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A toolbar on the header’s row',
        'Outside the button and outside the heading, because the pattern requires the trigger to be the only element in it — and a control inside a button is invalid besides.',
        `<div slCollapsible variant="framed" [open]="true">
          <h3 slCollapsibleHeader>
            <button slCollapsibleTrigger description="2 regras ativas">Regras de frete</button>
          </h3>
          <div slCollapsibleActions>
            <div slToolbar aria-label="Rule actions" size="sm">
              <button slButton size="sm" variant="ghost">Edit</button>
              <button slButton size="sm" variant="ghost">Duplicate</button>
            </div>
          </div>
          <div slCollapsiblePanel>
            <p slText size="sm">Free shipping over $250.00 for the Southeast region.</p>
          </div>
        </div>`,
      ) +
        scene(
          'The same set below 22rem',
          'The family answers its own inline size: the actions leave the header’s row and take one of their own, and the panel moves down with them.',
          measure(`<div slCollapsible variant="framed" [open]="true">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger description="2 regras ativas">Regras de frete</button>
            </h3>
            <div slCollapsibleActions>
              <div slToolbar aria-label="Rule actions, narrow" size="sm">
                <button slButton size="sm" variant="ghost">Edit</button>
              </div>
            </div>
            <div slCollapsiblePanel>
              <p slText size="sm">Free shipping over $250.00.</p>
            </div>
          </div>`),
        ),
    ),
  }),
};

export const Mount: Story = {
  parameters: scenario('mount'),
  render: () => ({
    template: grid(
      2,
      scene(
        'lazy, with a template',
        'ng-content is built whether or not it is inserted, so lazy needs an ng-template[slCollapsibleContent] — Angular Material’s own answer, and this ecosystem already knows it.',
        `<div slCollapsible variant="framed" mount="lazy">
          <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery history</button></h3>
          <div slCollapsiblePanel>
            <ng-template slCollapsibleContent>
              <p slText size="sm">Delivered on September 2 by Anna Rivers.</p>
            </ng-template>
          </div>
        </div>`,
      ) +
        scene(
          'until-found, for a page a reader searches',
          'The panel carries hidden="until-found", so the browser’s own find-in-page reaches the text inside a closed panel and opens it. Search this page for “Rivers”.',
          `<div slCollapsible variant="framed" mount="until-found">
            <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery history</button></h3>
            <div slCollapsiblePanel>
              <p slText size="sm">Delivered on September 2 by Anna Rivers.</p>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      3,
      scene(
        'Hover and press',
        'Hover lays a wash under the whole row and press goes one step further, so the target is the row rather than the words inside it.',
        address('variant="ruled"', 'Hover here') +
          address('variant="ruled" [open]="true"', 'And here, with the panel open'),
      ) +
        scene(
          'disabled',
          'The native attribute on the trigger, so the browser refuses the press and the row answers neither hover nor active. The words stay legible rather than merely faded.',
          address('variant="ruled" [disabled]="true"'),
        ) +
        scene(
          'loading',
          'The panel keeps a line’s height and says aria-busy, so the reader is not handed an empty frame. What stands in for the content is slSkeleton, composed here.',
          `<div slCollapsible variant="ruled" mount="lazy" [open]="true" [loading]="true">
            <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery history</button></h3>
            <div slCollapsiblePanel>
              <span slSkeleton shape="text"></span>
            </div>
          </div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      3,
      scene(
        'A title longer than its row',
        'The row grows and the mark keeps its own column, so the words never push the chevron off the line. Carbon truncates instead; here that is a word a consumer says.',
        measure(
          address(
            'variant="ruled"',
            'Return conditions for international orders with an invoice issued abroad',
          ),
        ),
      ) +
        scene(
          'The same title, truncated',
          'Clipped to one line with an ellipsis, and the whole string still in the DOM — the library decided once that truncation never removes content from it.',
          measure(
            address(
              'variant="ruled" [truncate]="true"',
              'Return conditions for international orders with an invoice issued abroad',
            ),
          ),
        ) +
        scene(
          'An unbroken token, and another script',
          'A digest breaks inside itself rather than setting the width of the row, and a right-to-left title is isolated from the row without taking the alignment from the page.',
          measure(
            address('variant="ruled"', 'a3f9c1e77b04d2a6f8e5c30b19d7a4f2c6b8e0d1') +
              address('variant="ruled"', 'تفاصيل الشحن الدولي'),
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The instance, from the template',
        'exportAs reaches isOpen(), toggle() and every resolved axis without a component class in between — the escape hatch this ecosystem reaches for first.',
        `<div slCollapsible #panel="slCollapsible" variant="framed">
          <h3 slCollapsibleHeader><button slCollapsibleTrigger>Payment methods</button></h3>
          <div slCollapsiblePanel>
            <p slText size="sm">Open: {{ panel.isOpen() }}</p>
          </div>
        </div>`,
      ) +
        scene(
          'One inside another’s panel',
          'The inner disclosure stays closed while the outer one is open, because every rule the family owns reaches its parts as a child rather than a descendant.',
          `<div slCollapsible variant="framed" [open]="true">
            <h3 slCollapsibleHeader><button slCollapsibleTrigger>Advanced settings</button></h3>
            <div slCollapsiblePanel>${address('variant="ruled" size="sm"', 'HTTP headers')}</div>
          </div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One ordinary tab stop',
        'Tab reaches the trigger like any other button and Enter or Space toggles it, because the control is a button and the family binds no key at all.',
        address('variant="ruled"', 'Delivery address') +
          address('variant="ruled"', 'Payment methods'),
      ) +
        scene(
          'Which device asked',
          'A click synthesised by the keyboard reports no detail and a real one reports the click count, which is how the reason is recovered without a key listener.',
          `<div slCollapsible variant="ruled" #request (openChangeRequest)="reason = $event.reason">
            <h3 slCollapsibleHeader>
              <button slCollapsibleTrigger>Click, then use Enter or Space</button>
            </h3>
            <div slCollapsiblePanel><p slText size="sm">The reason changes with the device.</p></div>
          </div>
          <p slText size="sm" tone="muted">reason: {{ reason ?? '—' }}</p>`,
        ),
    ),
  }),
};
