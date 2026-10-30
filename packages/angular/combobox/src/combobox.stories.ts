import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCombobox } from './combobox';
import { provideComboboxDefaults } from './combobox-defaults';
import type {
  ComboboxAlign,
  ComboboxAutocomplete,
  ComboboxOpenOn,
  ComboboxSide,
  ComboboxSize,
  ComboboxVariant,
  ComboboxWidth,
} from './combobox-defaults';
import { SlComboboxGroup, SlComboboxItem, SlComboboxSeparator } from './combobox-items';
import { ANGULAR_COMBOBOX_DOCS, ANGULAR_COMBOBOX_TOKENS } from './combobox.docs';

interface ComboboxStoryArgs {
  align: ComboboxAlign;
  allowsCustomValue: boolean;
  autocomplete: ComboboxAutocomplete;
  autoHighlight: boolean;
  clearable: boolean;
  disabled: boolean;
  highlightMatch: boolean;
  loop: boolean;
  openOn: ComboboxOpenOn;
  side: ComboboxSide;
  size: ComboboxSize;
  variant: ComboboxVariant;
  width: ComboboxWidth;
}

/**
 * Every demonstration opens `[portal]="false"` inside the workbench's own
 * viewport box, so a popup opened in one scene cannot draw over the scene above
 * it.
 */
const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_COMBOBOX_DOCS.combobox.scenes, {
    async: Async,
    autocomplete: Autocomplete,
    clearable: Clearable,
    composition: Composition,
    'custom-value': CustomValue,
    creation: Creation,
    empty: Empty,
    filtering: Filtering,
    form: InAForm,
    groups: Groups,
    keyboard: Keyboard,
    'long-content': LongContent,
    playground: Playground,
    sizes: Sizes,
    states: States,
    variants: Variants,
  }) as never;

const FRUIT = `
  <sl-combobox-item value="blueberry" label="Blueberry" />
  <sl-combobox-item value="raspberry" label="Raspberry" />
  <sl-combobox-item value="cloudberry" label="Cloudberry" />
  <sl-combobox-item value="grapefruit" label="Grapefruit" />
  <sl-combobox-item value="pomelo" label="Pomelo" />
  <sl-combobox-item value="redcurrant" label="Redcurrant" />
`;

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>
`;

const viewport = (body: string, size = 'layer') =>
  `<div class="slotted-demo-viewport" data-place="top" data-size="${size}">${body}</div>`;

const startsWith = (label: string, query: string) =>
  label.toLowerCase().startsWith(query.toLowerCase());

const meta: Meta<ComboboxStoryArgs> = {
  title: 'Components/Combobox',
  decorators: [
    moduleMetadata({
      imports: [
        SlField,
        SlFieldDescription,
        SlFieldError,
        SlFieldLabel,
        SlCombobox,
        SlComboboxGroup,
        SlComboboxItem,
        SlComboboxSeparator,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Combobox',
        description:
          'A text input with a listbox of options filtered by what was typed. The typed text and the chosen key are two contracts, not one.',
        framework: 'Angular',
        ...ANGULAR_COMBOBOX_DOCS.combobox,
        tokens: ANGULAR_COMBOBOX_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ComboboxStoryArgs>;

export const Playground: Story = {
  args: {
    align: 'start',
    allowsCustomValue: false,
    autocomplete: 'list',
    autoHighlight: true,
    clearable: false,
    disabled: false,
    highlightMatch: true,
    loop: false,
    openOn: 'input',
    side: 'bottom',
    size: 'md',
    variant: 'outline',
    width: 'anchor',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args, context) => ({
    props: { ...args, pictured: isolated(context) },
    template: viewport(`
      <sl-combobox
        aria-label="Fruit"
        placeholder="Search fruit"
        [inputValue]="'berr'"
        [open]="pictured"
        [portal]="false"
        [align]="align"
        [allowsCustomValue]="allowsCustomValue"
        [autocomplete]="autocomplete"
        [autoHighlight]="autoHighlight"
        [clearable]="clearable"
        [disabled]="disabled"
        [highlightMatch]="highlightMatch"
        [loop]="loop"
        [openOn]="openOn"
        [side]="side"
        [size]="size"
        [variant]="variant"
        [width]="width"
      >${FRUIT}</sl-combobox>
    `),
  }),
};

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), startsWith },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          'The default comparison',
          'Locale-sensitive: resume finds Resumé, and the mark shows the span the collator matched.',
          viewport(`
            <sl-combobox aria-label="Document" [inputValue]="'resume'" [open]="pictured" [portal]="false">
              <sl-combobox-item value="resume" label="Resumé" />
              <sl-combobox-item value="report" label="Report" />
            </sl-combobox>
          `),
        )}
        ${scene(
          "A comparison of the consumer's own",
          'startsWith rather than contains, so berr finds nothing and Blue finds one.',
          viewport(
            `<sl-combobox aria-label="Fruit" placeholder="Search fruit" [filter]="startsWith" [inputValue]="'berr'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
      </div>
    `,
  }),
};

export const Autocomplete: Story = {
  parameters: scenario('autocomplete'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="3">
        ${scene(
          'none',
          'The popup shows the same options whatever is typed into the field.',
          viewport(
            `<sl-combobox aria-label="Fruit" autocomplete="none" [filter]="null" [inputValue]="'berr'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
        ${scene(
          'list',
          'The default: the popup shows the options that match what is typed.',
          viewport(
            `<sl-combobox aria-label="Fruit" autocomplete="list" [inputValue]="'berr'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
        ${scene(
          'both',
          'As list, and the rest of the first match is written into the field as a selected range.',
          viewport(
            `<sl-combobox aria-label="Fruit" autocomplete="both" [inputValue]="'blue'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
      </div>
    `,
  }),
};

export const CustomValue: Story = {
  parameters: scenario('custom-value'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          'Refused',
          "Enter — and leaving the field — put the text back to the committed option's label, which is the pattern's own reverts. inputReset carries what was refused (CB7).",
          viewport(
            `<sl-combobox aria-label="Fruit" [inputValue]="'Durian'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
        ${scene(
          'Allowed',
          'Enter — and leaving the field — commit the typed text, and the request carries it as the value.',
          viewport(
            `<sl-combobox aria-label="Fruit" allowsCustomValue [inputValue]="'Durian'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
      </div>
    `,
  }),
};

/**
 * CB8. The family draws the offer and reports the query; adding the value is
 * the consumer's, because only it knows which of its collections can grow.
 *
 * The item asks for a tag input here. This family declines `multiple` — its
 * contract defers a collection of chosen values to `multi-select` — so the
 * story shows creation on the one value a combobox holds.
 */
export const Creation: Story = {
  parameters: scenario('creation'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          'Offered',
          'Nothing matched, so the last option offers to add what was typed. It is an option: ArrowDown reaches it and Enter takes it.',
          viewport(
            `<sl-combobox aria-label="Fruit" creatable [inputValue]="'Durian'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
        ${scene(
          'Refused',
          "Without creatable the popup says nothing matched, and the text is the reader's to correct.",
          viewport(
            `<sl-combobox aria-label="Fruit" [inputValue]="'Durian'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
          ),
        )}
      </div>
    `,
  }),
};

export const Async: Story = {
  parameters: scenario('async'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          'Travelling',
          "The status row keeps the popup's measure, so nothing jumps when the results land.",
          viewport(
            `<sl-combobox aria-label="Reviewer" loading [inputValue]="'mar'" [open]="pictured" [portal]="false"></sl-combobox>`,
          ),
        )}
        ${scene(
          'Landed',
          'The same row becomes the live region, and says how many options answered.',
          viewport(`
            <sl-combobox aria-label="Reviewer" [inputValue]="'man'" [open]="pictured" [portal]="false">
              <sl-combobox-item value="amanda" label="Amanda Okoro" />
              <sl-combobox-item value="roman" label="Roman Petrov" />
              <sl-combobox-item value="norman" label="Norman Vaz" />
            </sl-combobox>
          `),
        )}
      </div>
    `,
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: viewport(
      `
      <sl-combobox aria-label="Produce" [inputValue]="'berry'" [open]="pictured" [portal]="false">
        <sl-combobox-group label="Berries">
          <sl-combobox-item value="blueberry" label="Blueberry" />
          <sl-combobox-item value="raspberry" label="Raspberry" />
        </sl-combobox-group>
        <sl-combobox-group label="Citrus">
          <sl-combobox-item value="grapefruit" label="Grapefruit" />
          <sl-combobox-item value="pomelo" label="Pomelo" />
        </sl-combobox-group>
      </sl-combobox>
    `,
      'tall',
    ),
  }),
};

export const Clearable: Story = {
  parameters: scenario('clearable'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          'Empty',
          'The button is absent until the field holds something to take back.',
          `<sl-combobox aria-label="Fruit" placeholder="Search fruit" clearable [portal]="false">${FRUIT}</sl-combobox>`,
        )}
        ${scene(
          'Holding a value',
          'One press takes both the text and the chosen key, and returns focus.',
          `<sl-combobox aria-label="Fruit" clearable [inputValue]="'Blueberry'" [value]="'blueberry'" [portal]="false">${FRUIT}</sl-combobox>`,
        )}
      </div>
    `,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-stack">
        <sl-combobox aria-label="Small" size="sm" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Medium" size="md" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Large" size="lg" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
      </div>
    `,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-stack">
        <sl-combobox aria-label="Outline" variant="outline" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Subtle" variant="subtle" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Plain" variant="plain" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
      </div>
    `,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-stack">
        <sl-combobox aria-label="Required" placeholder="Required" [required]="true" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Invalid" [invalid]="true" [inputValue]="'Durian'" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Read only" [readOnly]="true" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
        <sl-combobox aria-label="Disabled" [disabled]="true" [inputValue]="'Blueberry'" [portal]="false">${FRUIT}</sl-combobox>
      </div>
    `,
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: viewport(
      `<sl-combobox aria-label="Fruit" placeholder="Search fruit" [inputValue]="'zzz'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
    ),
  }),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: viewport(
      `
      <sl-combobox aria-label="Record" [inputValue]="'9f2c'" [open]="pictured" [portal]="false">
        <sl-combobox-item value="urn" label="urn:acme:catalogue:9f2c41ab8de07c5511903fbe" />
        <sl-combobox-item
          value="fi"
          label="Rekisteröintitunnus 9f2c, pitkä ja käännetty, ja vielä pidempi kuin ensimmäinen"
          description="An option long enough to need a second line, and it stops there"
        />
      </sl-combobox>
    `,
      'tall',
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: viewport(
      `<sl-combobox aria-label="Fruit" placeholder="Search fruit" [inputValue]="'berr'" [open]="pictured" [portal]="false">${FRUIT}</sl-combobox>`,
      'tall',
    ),
  }),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), chosen: null as string | null },
    template: `
      <div class="slotted-demo-stack">
        <div slField [required]="true">
          <label slFieldLabel>Reviewer</label>
          <sl-combobox aria-label="Reviewer" name="reviewer" placeholder="Search reviewers" [portal]="false" (valueChange)="chosen = $event">${FRUIT}</sl-combobox>
          <span slFieldDescription>{{ chosen === null ? 'The hidden input submits the key, not the text.' : 'Submitting ' + chosen + '.' }}</span>
        </div>
        <div slField [required]="true" [invalid]="true">
          <label slFieldLabel>Second reviewer</label>
          <sl-combobox aria-label="Second reviewer" name="second" placeholder="Search reviewers" [portal]="false">${FRUIT}</sl-combobox>
          <span slFieldError>Choose someone from the list.</span>
        </div>
      </div>
    `,
  }),
};

export const Composition: Story = {
  decorators: [
    moduleMetadata({
      providers: [provideComboboxDefaults({ size: 'sm', variant: 'subtle' })],
    }),
  ],
  parameters: scenario('composition'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: viewport(
      `<sl-combobox aria-label="Fruit" placeholder="Search fruit" [inputValue]="'zzz'" [open]="pictured" [portal]="false" [messages]="{ empty: 'Nothing grows by that name' }">${FRUIT}</sl-combobox>`,
      'tall',
    ),
  }),
};
