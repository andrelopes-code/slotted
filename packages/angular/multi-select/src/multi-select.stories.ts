import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlMultiSelect } from './multi-select';
import { provideMultiSelectDefaults } from './multi-select-defaults';
import type {
  MultiSelectAlign,
  MultiSelectChosenOptions,
  MultiSelectOverflow,
  MultiSelectSide,
  MultiSelectSize,
  MultiSelectVariant,
  MultiSelectWidth,
} from './multi-select-defaults';
import {
  SlMultiSelectGroup,
  SlMultiSelectItem,
  SlMultiSelectSeparator,
} from './multi-select-items';
import { ANGULAR_MULTI_SELECT_DOCS, ANGULAR_MULTI_SELECT_TOKENS } from './multi-select.docs';

interface MultiSelectStoryArgs {
  align: MultiSelectAlign;
  chosenOptions: MultiSelectChosenOptions;
  clearable: boolean;
  creatable: boolean;
  disabled: boolean;
  editable: boolean;
  highlightMatch: boolean;
  loop: boolean;
  overflow: MultiSelectOverflow;
  reorderable: boolean;
  side: MultiSelectSide;
  size: MultiSelectSize;
  variant: MultiSelectVariant;
  width: MultiSelectWidth;
}

/**
 * Every demonstration opens `[portal]="false"` inside the workbench's own
 * viewport box, so a popup opened in one scene cannot draw over the scene above
 * it.
 *
 * **Only a scene that opens a layer gets that box.** It is thirteen rems tall,
 * which is the room a popup needs and four times the height of the control
 * alone: a scene with no layer put a 34-pixel control at the top of an empty
 * box, which is the canvas `references/stories.md` refuses.
 *
 * **Every scene takes one column.** `data-columns` is a claim that the family
 * reads correctly in half or a third of the page, and this one wraps its row,
 * truncates its chips and answers its own width — at a third of the page the
 * chips came out as `chec… ×`.
 */
const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_MULTI_SELECT_DOCS['multi-select'].scenes, {
    chips: Chips,
    composition: Composition,
    creation: Creation,
    duplicates: Duplicates,
    editing: Editing,
    filtering: Filtering,
    form: InAForm,
    groups: Groups,
    keyboard: Keyboard,
    limit: Limit,
    'loading-and-empty': LoadingAndEmpty,
    'long-content': LongContent,
    overflow: Overflow,
    paste: Paste,
    playground: Playground,
    reorder: Reorder,
    sizes: Sizes,
    states: States,
    variants: Variants,
  }) as never;

/**
 * One domain for the whole page: the incident report an on-call engineer fills
 * in. Real service names, real labels, real people — because a control's
 * defects only appear against content a product would actually hold.
 */
const SERVICES = `
  <sl-multi-select-item value="checkout-api" label="checkout-api" description="Node 22 · eu-west-1" />
  <sl-multi-select-item value="payments-worker" label="payments-worker" description="Go 1.24 · eu-west-1" />
  <sl-multi-select-item value="billing-web" label="billing-web" description="Next.js · edge" />
  <sl-multi-select-item value="auth-gateway" label="auth-gateway" description="Rust · global" />
  <sl-multi-select-item value="notification-relay" label="notification-relay" description="Elixir · eu-west-1" />
  <sl-multi-select-item value="search-indexer" label="search-indexer" description="Java 21 · eu-central-1" />
  <sl-multi-select-item value="webhooks-dispatcher" label="webhooks-dispatcher" description="Node 22 · us-east-1" />
  <sl-multi-select-item value="reporting-etl" label="reporting-etl" description="Python 3.13 · nightly" />
`;

const LABELS = `
  <sl-multi-select-item value="regression" label="regression" />
  <sl-multi-select-item value="data-loss" label="data-loss" />
  <sl-multi-select-item value="customer-reported" label="customer-reported" />
  <sl-multi-select-item value="needs-postmortem" label="needs-postmortem" />
`;

const RESPONDERS = `
  <sl-multi-select-item value="anna.pearson" label="Anna Pearson" description="Payments · on call" />
  <sl-multi-select-item value="thomas.lindqvist" label="Thomas Lindqvist" description="Platform" />
  <sl-multi-select-item value="wei.zhang" label="Wei Zhang" description="Integrations" />
  <sl-multi-select-item value="nadia.haddad" label="Nadia Haddad" description="SRE · escalation" />
`;

const ALL_SERVICES = [
  'checkout-api',
  'payments-worker',
  'billing-web',
  'auth-gateway',
  'notification-relay',
  'search-indexer',
  'webhooks-dispatcher',
  'reporting-etl',
];

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>
`;

/**
 * The box a layer opens into. It is only as tall as it needs to be: thirteen
 * rems while the popup is open, and the four rems a control alone occupies
 * while it is not — a 34-pixel control at the top of a 208-pixel box is the
 * empty canvas `references/stories.md` refuses, and the popup is closed on the
 * reference page by design.
 */
const viewport = (body: string, open: boolean) =>
  `<div class="slotted-demo-viewport" data-place="top"${open ? ' data-size="tall"' : ''}>${body}</div>`;

const startsWith = (label: string, query: string) => label.startsWith(query);

const meta: Meta<MultiSelectStoryArgs> = {
  title: 'Components/Multi Select',
  decorators: [
    moduleMetadata({
      imports: [
        SlField,
        SlFieldDescription,
        SlFieldError,
        SlFieldLabel,
        SlMultiSelect,
        SlMultiSelectGroup,
        SlMultiSelectItem,
        SlMultiSelectSeparator,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Multi Select',
        description:
          'A frame of chosen values, with a field that adds more. The set is ordered, the order is the reader’s, and what the control refuses is reported rather than dropped.',
        framework: 'Angular',
        ...ANGULAR_MULTI_SELECT_DOCS['multi-select'],
        tokens: ANGULAR_MULTI_SELECT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<MultiSelectStoryArgs>;

export const Playground: Story = {
  args: {
    align: 'start',
    chosenOptions: 'show',
    clearable: true,
    creatable: false,
    disabled: false,
    editable: false,
    highlightMatch: true,
    loop: false,
    overflow: 'wrap',
    reorderable: false,
    side: 'bottom',
    size: 'md',
    variant: 'outline',
    width: 'anchor',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args, context) => ({
    props: { ...args, chosen: ['checkout-api', 'payments-worker'], pictured: isolated(context) },
    template: viewport(
      `
      <sl-multi-select
        aria-label="Affected services"
        placeholder="Add a service"
        [defaultValue]="chosen"
        [open]="pictured"
        [portal]="false"
        [align]="align"
        [chosenOptions]="chosenOptions"
        [clearable]="clearable"
        [creatable]="creatable"
        [disabled]="disabled"
        [editable]="editable"
        [highlightMatch]="highlightMatch"
        [loop]="loop"
        [overflow]="overflow"
        [reorderable]="reorderable"
        [side]="side"
        [size]="size"
        [variant]="variant"
        [width]="width"
      >${SERVICES}</sl-multi-select>
    `,
      isolated(context),
    ),
  }),
};

export const Chips: Story = {
  parameters: scenario('chips'),
  render: (_args, context) => ({
    props: {
      few: ['checkout-api', 'auth-gateway', 'reporting-etl'],
      many: ALL_SERVICES,
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Inside the frame, beside the caret',
          'This control holds a real input, so a chip’s remove button is not a button inside a button — which is why select draws its row above the control instead.',
          `<sl-multi-select aria-label="Affected services" [defaultValue]="few" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
        ${scene(
          'The frame grows by whole rows',
          'An empty control is exactly the height of a text field beside it; each wrapped row adds one chip and one gap, and the fourth row scrolls rather than showing a sliver.',
          `<sl-multi-select aria-label="Affected services" [defaultValue]="many" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
      </div>
    `,
  }),
};

export const Creation: Story = {
  parameters: scenario('creation'),
  render: (_args, context) => ({
    props: { held: ['regression'], pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Refused',
          'Without creatable, typing a label the list does not hold matches nothing and Enter does nothing: the set only ever holds options.',
          `<sl-multi-select aria-label="Labels" [inputValue]="'rollback'" [portal]="false">${LABELS}</sl-multi-select>`,
        )}
        ${scene(
          'Offered',
          'With creatable the offer is an option — the arrows reach it and Enter takes it — and its mark is the plus, because nothing is in the set yet.',
          viewport(
            `<sl-multi-select aria-label="Labels" creatable [defaultValue]="held" [inputValue]="'rollback'" [open]="pictured" [portal]="false">${LABELS}</sl-multi-select>`,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const Limit: Story = {
  parameters: scenario('limit'),
  render: (_args, context) => ({
    props: {
      full: ['ana.pereira', 'wei.zhang', 'nadia.haddad'],
      one: ['ana.pereira'],
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Under the limit',
          'The counter is drawn only because max is set, and it counts in the muted ink while there is room left.',
          `<sl-multi-select aria-label="Responders" [defaultValue]="one" [max]="3" [portal]="false">${RESPONDERS}</sl-multi-select>`,
        )}
        ${scene(
          'Full',
          'The counter takes the accent, the root carries data-complete, and every responder not already named answers aria-disabled — a value already held stays takeable, because taking it out is what a full control still has to allow.',
          viewport(
            `<sl-multi-select aria-label="Responders" [defaultValue]="full" [max]="3" [open]="pictured" [portal]="false">${RESPONDERS}</sl-multi-select>`,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const Duplicates: Story = {
  parameters: scenario('duplicates'),
  render: (_args, context) => ({
    props: { pair: ['regression', 'regression'], one: ['regression'], pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Refused, and shown where',
          'The comparison is locale-sensitive, so typing REGRESSION finds the label already held; focus goes to that chip rather than nothing happening.',
          `<sl-multi-select aria-label="Labels" creatable [defaultValue]="one" [inputValue]="'REGRESSION'" [portal]="false">${LABELS}</sl-multi-select>`,
        )}
        ${scene(
          'Allowed',
          'A picking list where the same item may be counted twice sets allowDuplicates, and the second chip stands beside the first.',
          `<sl-multi-select aria-label="Labels" allowDuplicates creatable [defaultValue]="pair" [portal]="false">${LABELS}</sl-multi-select>`,
        )}
      </div>
    `,
  }),
};

export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: (_args, context) => ({
    props: {
      order: ['auth-gateway', 'checkout-api', 'payments-worker'],
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Alt with an arrow moves the focused chip',
          'Reach a chip with ArrowLeft from the empty field, then hold Alt: the arrows follow the writing direction, Alt+Home and Alt+End go to either end, and the request carries keyboard so a saved order listens for exactly that.',
          `<sl-multi-select aria-label="Rollback order" reorderable [defaultValue]="order" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
      </div>
    `,
  }),
};

export const Paste: Story = {
  parameters: scenario('paste'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'One list, split',
          'Paste checkout-api, payments-worker, billing-web into the field: the same delimiters the comma key reads split the clipboard, so the two paths cannot disagree.',
          `<sl-multi-select aria-label="Affected services" addOnPaste creatable placeholder="Paste a list" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
        ${scene(
          'More than the limit allows',
          'Values are taken in order up to the limit and the rest leave through valueRefuse with the cause — the case none of the eight surveyed implementations describes.',
          `<sl-multi-select aria-label="Affected services" addOnPaste creatable [max]="2" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
      </div>
    `,
  }),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: (_args, context) => ({
    props: { typo: ['regresion', 'data-loss'], pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Enter on a chip opens it',
          'A mistyped label is corrected rather than removed and retyped: Enter turns the cell into a field, Enter commits and Escape reverts — the grid pattern’s own answer for a cell holding editable content.',
          `<sl-multi-select aria-label="Labels" creatable editable [defaultValue]="typo" [portal]="false">${LABELS}</sl-multi-select>`,
        )}
      </div>
    `,
  }),
};

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: (_args, context) => ({
    props: { held: ['checkout-api', 'payments-worker'], pictured: isolated(context), startsWith },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'The default comparison',
          'Locale-sensitive contains, and the mark shows the span the collator matched rather than a substring that would disagree with it.',
          viewport(
            `<sl-multi-select aria-label="Affected services" [inputValue]="'pay'" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
        ${scene(
          'A comparison of the consumer’s own',
          'startsWith rather than contains, so pay finds payments-worker and nothing else.',
          viewport(
            `<sl-multi-select aria-label="Affected services" [filter]="startsWith" [inputValue]="'pay'" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
        ${scene(
          'Chosen options withdrawn',
          'chosenOptions="hide" takes a service already named out of the list, for a collection long enough that a reader would rather see only what is left.',
          viewport(
            `<sl-multi-select aria-label="Affected services" chosenOptions="hide" [defaultValue]="held" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => ({
    props: { held: ['checkout-api'], pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Three teams, and a rule between two of them',
          'Type integ and the two groups that answer nothing leave the surface entirely, rather than standing as headings over nothing.',
          viewport(
            `
            <sl-multi-select aria-label="Affected services" [defaultValue]="held" [open]="pictured" [portal]="false">
              <sl-multi-select-group label="Payments">
                <sl-multi-select-item value="checkout-api" label="checkout-api" description="Node 22 · eu-west-1" />
                <sl-multi-select-item value="payments-worker" label="payments-worker" description="Go 1.24 · eu-west-1" />
              </sl-multi-select-group>
              <sl-multi-select-group label="Platform">
                <sl-multi-select-item value="auth-gateway" label="auth-gateway" description="Rust · global" />
                <sl-multi-select-item value="search-indexer" label="search-indexer" description="Java 21 · eu-central-1" />
              </sl-multi-select-group>
              <sl-multi-select-separator />
              <sl-multi-select-group label="Integrations">
                <sl-multi-select-item value="webhooks-dispatcher" label="webhooks-dispatcher" description="Node 22 · us-east-1" />
                <sl-multi-select-item value="reporting-etl" label="reporting-etl" description="Python 3.13 · nightly" />
              </sl-multi-select-group>
            </sl-multi-select>
          `,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: (_args, context) => ({
    props: { many: ALL_SERVICES, pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'wrap',
          'The frame grows by rows to three and then scrolls with no bar of its own: every chip stays in the DOM, and the counter, the row’s own name and the popup’s band are what say there is more.',
          `<sl-multi-select aria-label="Affected services" overflow="wrap" [defaultValue]="many" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
        ${scene(
          'collapse',
          'One line high, for a control in a table row: what did not fit becomes a counting chip in the outline variant, and pressing it opens the popup whose band holds every value.',
          viewport(
            `<sl-multi-select aria-label="Affected services" overflow="collapse" [defaultValue]="many" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: (_args, context) => ({
    props: { one: ['checkout-api'], pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Three steps, beside an empty one',
          'An empty control is exactly the height of a text field on the same form; the chip is what changes it, and only at the tightest density does that cost two pixels.',
          `
            <div class="slotted-demo-stack">
              <sl-multi-select aria-label="Small" size="sm" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Medium" size="md" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Large" size="lg" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Empty" size="md" placeholder="Add a service" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: (_args, context) => ({
    props: {
      one: ['checkout-api'],
      two: ['auth-gateway', 'search-indexer'],
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'outline and subtle',
          'An edge for a form, and a ground for a panel that already has one.',
          `
            <div class="slotted-demo-stack">
              <sl-multi-select aria-label="Outline" variant="outline" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Subtle" variant="subtle" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
        ${scene(
          'plain, in the row it exists for',
          'No edge, no lift and no ground: the row is the ground, and a resting shadow would draw a cell where there is none.',
          `
            <div class="slotted-demo-rows">
              <span>INC-4821</span>
              <sl-multi-select aria-label="INC-4821 services" variant="plain" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <span>INC-4822</span>
              <sl-multi-select aria-label="INC-4822 services" variant="plain" [defaultValue]="two" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: (_args, context) => ({
    props: {
      one: ['checkout-api'],
      two: ['checkout-api', 'auth-gateway'],
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'disabled and readOnly',
          'Disabled answers nothing and keeps its values legible rather than faded away; read-only keeps the caret and the copy, and withholds the popup and every remove control.',
          `
            <div class="slotted-demo-stack">
              <sl-multi-select aria-label="Disabled" disabled [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Read-only" readOnly [defaultValue]="two" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
        ${scene(
          'required and invalid',
          'The invalid border and the focus ring move together, because the family points the ring token at the danger step rather than repainting each rule that draws focus.',
          `
            <div class="slotted-demo-stack">
              <sl-multi-select aria-label="Required" required placeholder="Add a service" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Invalid" invalid required placeholder="Add a service" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const LoadingAndEmpty: Story = {
  parameters: scenario('loading-and-empty'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'While the answer travels',
          'The ring stands where the chevron stood, and what was already found stays on the surface while the rest travels: the waiting rows are the shape of what is still coming, under the results that are already there.',
          viewport(
            `<sl-multi-select aria-label="Affected services" loading [inputValue]="'pay'" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
        ${scene(
          'Nothing answered',
          'The message keeps the surface’s measure rather than collapsing it, so nothing jumps when results land.',
          viewport(
            `<sl-multi-select aria-label="Affected services" [inputValue]="'mainframe'" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: (_args, context) => ({
    props: {
      long: ['notification-relay-eu-west-1-canary', 'webhooks-dispatcher-us-east-1-replay'],
      narrow: ['checkout-api', 'auth-gateway', 'reporting-etl'],
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'A name longer than the frame',
          'The chip truncates and the value stays whole in the accessibility tree and to a page search: truncation never removes content from the DOM.',
          `<sl-multi-select aria-label="Affected services" [defaultValue]="long" [portal]="false">${SERVICES}</sl-multi-select>`,
        )}
        ${scene(
          'Under 120 pixels',
          'A chip narrower than a word is a shape, so the chips withdraw and the counter answers instead. The width is watched rather than queried, because a container query would stop the frame’s width depending on its contents.',
          `
            <div class="slotted-demo-measure">
              <sl-multi-select aria-label="Affected services" [defaultValue]="narrow" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => ({
    props: {
      held: ['checkout-api', 'payments-worker', 'auth-gateway'],
      pictured: isolated(context),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'One tab stop, and the keys inside it',
          'Tab reaches the field once. From an empty field Backspace moves to the last chip and removes nothing; a second press removes it. Delete takes the focused chip out, ArrowLeft and ArrowRight walk the row, and any printable character sends the reader back to the field.',
          viewport(
            `<sl-multi-select aria-label="Affected services" [defaultValue]="held" [open]="pictured" [portal]="false">${SERVICES}</sl-multi-select>`,
            isolated(context),
          ),
        )}
      </div>
    `,
  }),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: (_args, context) => ({
    props: { held: ['checkout-api'], labels: ['regression'], pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Named, described and in error',
          'One hidden input per value under the name services, so a plain FormData receives all of them under one key. The label, the description and the error reach the field by ID.',
          `
            <div slField [invalid]="true" [required]="true">
              <label slFieldLabel>Affected services</label>
              <span slFieldDescription>Everything a customer would have noticed.</span>
              <sl-multi-select name="services" placeholder="Add a service" [portal]="false">${SERVICES}</sl-multi-select>
              <span slFieldError>Name at least one service</span>
            </div>
          `,
        )}
        ${scene(
          'Beside the controls it sits with',
          'An incident form: the same frame, the same height when empty, and the same focus ring as every other control on it.',
          `
            <div slField>
              <label slFieldLabel>Affected services</label>
              <sl-multi-select name="services" [defaultValue]="held" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
            <div slField>
              <label slFieldLabel>Labels</label>
              <sl-multi-select name="labels" creatable placeholder="Add a label" [defaultValue]="labels" [portal]="false">${LABELS}</sl-multi-select>
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) => ({
    props: { one: ['checkout-api'], two: ['auth-gateway'], pictured: isolated(context) },
    moduleMetadata: {
      providers: [provideMultiSelectDefaults({ size: 'sm', variant: 'subtle' })],
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Defaults an application sets once',
          'provideMultiSelectDefaults carries every axis; a binding written on one control still wins over it, which is the resolution order every family declares. The words come from the language in force.',
          `
            <div class="slotted-demo-stack">
              <sl-multi-select aria-label="From the provider" [defaultValue]="one" [portal]="false">${SERVICES}</sl-multi-select>
              <sl-multi-select aria-label="Overridden" variant="outline" [defaultValue]="two" [portal]="false">${SERVICES}</sl-multi-select>
            </div>
          `,
        )}
        ${scene(
          'The instance, reached from the template',
          'exportAs gives the template the component, so a button beside the control can focus it, open it or take the whole set at once — which is also the composition that replaces the select-all this family declined.',
          `
            <div class="slotted-demo-stack">
              <sl-multi-select #services="slMultiSelect" aria-label="Affected services" [portal]="false">${SERVICES}</sl-multi-select>
              <button type="button" (click)="services.focus()">Add a service</button>
            </div>
          `,
        )}
      </div>
    `,
  }),
};
