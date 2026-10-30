import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBold,
  lucideItalic,
  lucideStrikethrough,
  lucideUnderline,
} from '@ng-icons/lucide';
import { SlButton } from '@slotted/angular/button';
import { SlTextField } from '@slotted/angular/text-field';
import { SlToolbar, SlToolbarSeparator } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlToggleGroup } from './toggle-group';
import type {
  ToggleGroupOrientation,
  ToggleGroupSize,
  ToggleGroupVariant,
} from './toggle-group-defaults';
import { SlToggleGroupIcon, SlToggleGroupItem } from './toggle-group-parts';
import { ANGULAR_TOGGLE_GROUP_DOCS, ANGULAR_TOGGLE_GROUP_TOKENS } from './toggle-group.docs';

interface ToggleGroupStoryArgs {
  attached: boolean;
  disabled: boolean;
  fullWidth: boolean;
  loop: boolean;
  multiple: boolean;
  orientation: ToggleGroupOrientation;
  size: ToggleGroupSize;
  variant: ToggleGroupVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TOGGLE_GROUP_DOCS.toggleGroup.scenes, {
    playground: Playground,
    selection: Selection,
    variant: Variant,
    sizes: Sizes,
    orientation: Orientation,
    attached: Attached,
    states: States,
    iconOnly: IconOnly,
    width: Width,
    toolbar: InsideAToolbar,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  NgIcon,
  SlButton,
  SlText,
  SlTextField,
  SlToggleGroup,
  SlToggleGroupIcon,
  SlToggleGroupItem,
  SlToolbar,
  SlToolbarSeparator,
];

const meta: Meta<ToggleGroupStoryArgs> = {
  title: 'Components/ToggleGroup',
  component: SlToggleGroup,
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          lucideAlignCenter,
          lucideAlignLeft,
          lucideAlignRight,
          lucideBold,
          lucideItalic,
          lucideStrikethrough,
          lucideUnderline,
        }),
      ],
    }),
    moduleMetadata({ imports: DIRECTIVES }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toggle Group',
        description:
          'A set of two-state buttons sharing one value. The arrows move focus and never toggle, because each item is the APG Button pattern’s toggle button — the family whose arrows move the value is Segmented Control, and it is a radio group.',
        framework: 'Angular',
        ...ANGULAR_TOGGLE_GROUP_DOCS.toggleGroup,
        tokens: ANGULAR_TOGGLE_GROUP_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ToggleGroupStoryArgs>;

const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

const RANGE = `<button slToggleGroupItem value="day">Day</button>
  <button slToggleGroupItem value="week">Week</button>
  <button slToggleGroupItem value="month">Month</button>`;

const FORMATTING = `<button slToggleGroupItem value="bold" aria-label="Bold">
    <ng-icon slToggleGroupIcon name="lucideBold" />
  </button>
  <button slToggleGroupItem value="italic" aria-label="Italic">
    <ng-icon slToggleGroupIcon name="lucideItalic" />
  </button>
  <button slToggleGroupItem value="underline" aria-label="Sublinhado">
    <ng-icon slToggleGroupIcon name="lucideUnderline" />
  </button>
  <button slToggleGroupItem value="strike" aria-label="Tachado">
    <ng-icon slToggleGroupIcon name="lucideStrikethrough" />
  </button>`;

export const Playground: Story = {
  args: {
    attached: true,
    disabled: false,
    fullWidth: false,
    loop: true,
    multiple: false,
    orientation: 'horizontal',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="stack">
        <div
          slToggleGroup
          aria-label="Chart period"
          [defaultValue]="['week']"
          [size]="size"
          [variant]="variant"
          [orientation]="orientation"
          [attached]="attached"
          [fullWidth]="fullWidth"
          [multiple]="multiple"
          [loop]="loop"
          [disabled]="disabled"
        >
          ${RANGE}
        </div>
      </div>`,
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    template: grid(
      1,
      scene(
        'One at a time',
        'The value is an array of one. Press the item that is already on and the set empties, because a toggle group is allowed to hold nothing — which is what separates it from a radio group.',
        `<div slToggleGroup aria-label="Period" [defaultValue]="['week']">${RANGE}</div>`,
      ) +
        scene(
          'Several at once',
          'multiple caps the array at every item instead of at one, so a formatting bar holds bold and italic together. Nothing about the value&#39;s type changes with the mode.',
          `<div slToggleGroup aria-label="Estilo do texto" multiple [defaultValue]="['bold','italic']">${FORMATTING}</div>`,
        ) +
        scene(
          'A set that always holds one',
          'deselectable=false refuses the press that would empty the set, for a bar whose value a view depends on. It is ignored while multiple is true, where a set may always empty.',
          `<div slToggleGroup aria-label="Fixed period" [deselectable]="false" [defaultValue]="['week']">${RANGE}</div>`,
        ),
    ),
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Framed',
        'outline draws the bar&#39;s own edge, made by the items between them: they overlap by one border so the shared column holds one line rather than two, even at fractional zoom.',
        `<div slToggleGroup aria-label="Density with frame" [defaultValue]="['compact']">
           <button slToggleGroupItem value="comfortable">Comfortable</button>
           <button slToggleGroupItem value="compact">Compact</button>
           <button slToggleGroupItem value="dense">Dense</button>
         </div>`,
      ) +
        scene(
          'Bare',
          'ghost draws no frame, for a bar that sits inside something already framed. The item that is on keeps the same accent ground and edge, because “on” is one colour across the system.',
          `<div slToggleGroup aria-label="Density without frame" variant="ghost" [defaultValue]="['compact']">
             <button slToggleGroupItem value="comfortable">Comfortable</button>
             <button slToggleGroupItem value="compact">Compact</button>
             <button slToggleGroupItem value="dense">Dense</button>
           </div>`,
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The three steps',
        'The height, the padding, the type and the glyph all come from the control scales, so switching a page to dense shrinks each step whole rather than in parts.',
        `<div slToggleGroup aria-label="Sorting small" size="sm" [defaultValue]="['newest']">
           <button slToggleGroupItem value="newest">Newest</button>
           <button slToggleGroupItem value="oldest">Oldest</button>
         </div>
         <div slToggleGroup aria-label="Sorting medium" size="md" [defaultValue]="['newest']">
           <button slToggleGroupItem value="newest">Newest</button>
           <button slToggleGroupItem value="oldest">Oldest</button>
         </div>
         <div slToggleGroup aria-label="Sorting large" size="lg" [defaultValue]="['newest']">
           <button slToggleGroupItem value="newest">Newest</button>
           <button slToggleGroupItem value="oldest">Oldest</button>
         </div>`,
      ) +
        scene(
          'Beside the controls it shares a row with',
          'The bar states no frame of its own, so it is exactly one control tall — and a row holding a field, a toggle group and a button lines up on all three edges.',
          `<div class="slotted-demo-measure">
             <div slTextField><input slTextFieldInput value="Quarterly report" aria-label="Title" /></div>
           </div>
           <div slToggleGroup aria-label="Text style in line" multiple [defaultValue]="['bold']">${FORMATTING}</div>
           <button slButton tone="secondary" variant="outline">Publish changes</button>`,
          'row',
        ),
    ),
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Along the line',
        'ArrowLeft and ArrowRight move focus, mirrored in a right-to-left document, and the cross axis is left to the page so it keeps scrolling with focus inside the bar.',
        `<div slToggleGroup aria-label="Inline alignment" [defaultValue]="['center']">
           <button slToggleGroupItem value="start" aria-label="Start">
             <ng-icon slToggleGroupIcon name="lucideAlignLeft" />
           </button>
           <button slToggleGroupItem value="center" aria-label="Centro">
             <ng-icon slToggleGroupIcon name="lucideAlignCenter" />
           </button>
           <button slToggleGroupItem value="end" aria-label="Fim">
             <ng-icon slToggleGroupIcon name="lucideAlignRight" />
           </button>
         </div>`,
      ) +
        scene(
          'Down the page',
          'A vertical bar moves with ArrowUp and ArrowDown and writes aria-orientation, because role=group carries no implied direction of its own for a reader to assume.',
          `<div slToggleGroup aria-label="Stacked alignment" orientation="vertical" [defaultValue]="['center']">
             <button slToggleGroupItem value="start">Align left</button>
             <button slToggleGroupItem value="center">Center</button>
             <button slToggleGroupItem value="end">Align right</button>
           </div>`,
        ),
    ),
  }),
};

export const Attached: Story = {
  parameters: scenario('attached'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Joined into one bar',
        'The default. Look at the seam beside the item that is on: it states its own edge and the neighbour gives up the line that would be painted over it, so no grey touches the accent.',
        `<div slToggleGroup aria-label="Camadas unidas" multiple [defaultValue]="['terrain']">
           <button slToggleGroupItem value="roads">Streets</button>
           <button slToggleGroupItem value="terrain">Terrain</button>
           <button slToggleGroupItem value="traffic">Traffic</button>
         </div>`,
      ) +
        scene(
          'Spaced apart',
          'Each item keeps its own four corners and the group states the distance between them: twice the control gap, so two choices read as further apart than a mark is from its own word.',
          `<div slToggleGroup aria-label="Camadas separadas" multiple [attached]="false" [defaultValue]="['terrain']">
             <button slToggleGroupItem value="roads">Streets</button>
             <button slToggleGroupItem value="terrain">Terrain</button>
             <button slToggleGroupItem value="traffic">Traffic</button>
           </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One item out of action',
        'An unavailable item loses its ink and keeps its place; hover it and nothing answers, because a weaker state holds itself back for every stronger one.',
        `<div slToggleGroup aria-label="Format with one unavailable" [defaultValue]="['csv']">
           <button slToggleGroupItem value="csv">CSV</button>
           <button slToggleGroupItem value="xlsx" disabled>XLSX</button>
           <button slToggleGroupItem value="pdf">PDF</button>
         </div>`,
      ) +
        scene(
          'Unavailable while on',
          'The ground says unavailable and the edge says on, so a reader still learns which of the three was chosen. In high contrast the edge is all that carries it.',
          `<div slToggleGroup aria-label="Format unavailable" [defaultValue]="['pdf']">
             <button slToggleGroupItem value="csv" disabled>CSV</button>
             <button slToggleGroupItem value="xlsx" disabled>XLSX</button>
             <button slToggleGroupItem value="pdf" disabled>PDF</button>
           </div>`,
        ) +
        scene(
          'The whole group out of action',
          'disabled on the group reaches every item as the native attribute, which is also what makes the browser refuse focus and what makes the arrow ring skip them.',
          `<div slToggleGroup aria-label="Formato grupo inteiro" disabled [defaultValue]="['csv']">
             <button slToggleGroupItem value="csv">CSV</button>
             <button slToggleGroupItem value="xlsx">XLSX</button>
           </div>`,
        ) +
        scene(
          'Pointed at, and pressed',
          'An item that is off takes the neutral ground; one that is on answers the pointer on the accent ground&#39;s own steps, so the two states share no surface in any scheme.',
          `<div slToggleGroup aria-label="Format interaction" [defaultValue]="['xlsx']">
             <button slToggleGroupItem value="csv">CSV</button>
             <button slToggleGroupItem value="xlsx">XLSX</button>
           </div>`,
        ),
    ),
  }),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A formatting bar',
        'An item with only a mark draws square, and its accessible name is the aria-label the consumer wrote — the one thing the family cannot supply for artwork it did not choose.',
        `<div slToggleGroup aria-label="Estilo do texto" multiple [defaultValue]="['bold']">${FORMATTING}</div>`,
      ) +
        scene(
          'The same bar at the smallest step',
          'At sm and the dense density the item is twenty-four pixels, which is the WCAG minimum exactly — and a coarse pointer grows every control to forty-four through the theme.',
          `<div slToggleGroup aria-label="Estilo do texto pequeno" multiple size="sm" [defaultValue]="['bold']">${FORMATTING}</div>`,
        ),
    ),
  }),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => ({
    template: grid(
      1,
      scene(
        'As wide as its labels',
        'Left alone the bar shrinks to its content, which is what a set of toggles beside a paragraph needs and what every surveyed implementation defaults to.',
        `<div slToggleGroup aria-label="Billing content width" [defaultValue]="['monthly']">
           <button slToggleGroupItem value="monthly">Monthly</button>
           <button slToggleGroupItem value="yearly">Yearly</button>
         </div>`,
      ) +
        scene(
          'Sharing the whole line',
          'fullWidth gives every item an equal share of the line the bar was given. The labels stay centred, so the bar reads as one control rather than as two stretched buttons.',
          `<div slToggleGroup aria-label="Billing full line" fullWidth [defaultValue]="['monthly']">
             <button slToggleGroupItem value="monthly">Monthly</button>
             <button slToggleGroupItem value="yearly">Yearly</button>
           </div>`,
          'block',
        ),
    ),
  }),
};

export const InsideAToolbar: Story = {
  parameters: scenario('toolbar'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A bar owns the keyboard the group would have held',
        'Tab once and the whole toolbar is the stop; the arrows then cross the toggle group and the button alike. The group sees the bar in the DOM and stands down — nothing is passed to it.',
        `<div slToolbar aria-label="Formatting">
           <div slToggleGroup aria-label="Text style" multiple variant="ghost" [defaultValue]="['bold']">${FORMATTING}</div>
           <div slToolbarSeparator></div>
           <button slButton size="sm" tone="secondary" variant="ghost">Publicar</button>
         </div>`,
        'block',
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A label nine words long',
        'In a column narrower than the words, each item gives way rather than pushing the layout, and the label clips at the ellipsis with its whole string still in the DOM.',
        measure(
          `<div slToggleGroup aria-label="Frequency" fullWidth [defaultValue]="['now']">
             <button slToggleGroupItem value="now">Immediately</button>
             <button slToggleGroupItem value="digest">Once a day, in the evening digest</button>
           </div>`,
        ),
        'block',
      ) +
        scene(
          'One unbroken token, and a mirrored label',
          'An identifier with nowhere to break clips like any other string, and an Arabic label reads right to left inside a page that reads the other way without the bar mirroring.',
          measure(
            `<div slToggleGroup aria-label="Ambiente" fullWidth [defaultValue]="['staging']">
               <button slToggleGroupItem value="staging">staging-eu-west-1a</button>
               <button slToggleGroupItem value="prod">prod</button>
             </div>`,
          ) +
            `<div slToggleGroup aria-label="Idioma" [defaultValue]="['ar']">
               <button slToggleGroupItem value="ar"><span dir="rtl">العربية</span></button>
               <button slToggleGroupItem value="en">English</button>
             </div>`,
          'block',
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Every part is a directive on the consumer’s own element',
        'The button is the consumer&#39;s: its attributes, its listeners and any structural directive around it stay as written, and the family adds the wiring rather than the element.',
        `<div slToggleGroup aria-label="Camadas do consumidor" multiple [defaultValue]="['roads']">
           <button slToggleGroupItem value="roads" data-testid="roads">Ruas</button>
           <button slToggleGroupItem value="terrain">Relevo</button>
         </div>`,
      ) +
        scene(
          'A template reaches the instance',
          'exportAs hands the group and each item over, so a template reads selection() and pressed() from the family rather than holding a second copy of the same state.',
          `<div slToggleGroup #bar="slToggleGroup" aria-label="Camadas exportadas" multiple [defaultValue]="['roads']">
             <button slToggleGroupItem value="roads">Ruas</button>
             <button slToggleGroupItem value="terrain">Relevo</button>
           </div>
           <p slText size="sm" tone="muted">
             The group says {{ bar.selection().length }} of two layers are on.
           </p>`,
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
        'One stop, and the arrows inside it',
        'Tab reaches the bar once and lands on the item that is on; the arrows move focus without toggling anything, and Home and End reach the ends of the set.',
        `<div slToggleGroup aria-label="Period with wrap" [defaultValue]="['week']">${RANGE}</div>`,
      ) +
        scene(
          'Wrapping turned off',
          'With loop=false the ring stops at the ends instead of coming round, which is what a bar inside a longer row of controls wants so that Tab is the way out.',
          `<div slToggleGroup aria-label="Period without wrap" [loop]="false" [defaultValue]="['week']">${RANGE}</div>`,
        ),
    ),
  }),
};
