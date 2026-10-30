import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTagsInput } from './tags-input';
import { provideTagsInputDefaults } from './tags-input-defaults';
import type {
  TagsInputInvalidValues,
  TagsInputOverflow,
  TagsInputPendingOnBlur,
  TagsInputSize,
  TagsInputVariant,
} from './tags-input-defaults';
import { ANGULAR_TAGS_INPUT_DOCS, ANGULAR_TAGS_INPUT_TOKENS } from './tags-input.docs';

interface TagsInputStoryArgs {
  addOnPaste: boolean;
  allowDuplicates: boolean;
  clearable: boolean;
  disabled: boolean;
  editable: boolean;
  invalidValues: TagsInputInvalidValues;
  overflow: TagsInputOverflow;
  pendingOnBlur: TagsInputPendingOnBlur;
  readOnly: boolean;
  reorderable: boolean;
  size: TagsInputSize;
  variant: TagsInputVariant;
}

/**
 * Every scene takes one column: this family wraps its row, truncates its chips
 * and answers its own width, and `data-columns` is a claim that it reads
 * correctly in a third of the page.
 */
const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TAGS_INPUT_DOCS['tags-input'].scenes, {
    blur: Blur,
    composition: Composition,
    copy: Copy,
    duplicates: Duplicates,
    editing: Editing,
    form: InAForm,
    keyboard: Keyboard,
    limit: Limit,
    locked: Locked,
    'long-content': LongContent,
    overflow: Overflow,
    paste: Paste,
    'platform-validation': PlatformValidation,
    playground: Playground,
    recipients: Recipients,
    reorder: Reorder,
    sizes: Sizes,
    states: States,
    validity: Validity,
    variants: Variants,
  }) as never;

/**
 * One domain for the whole page: a message being composed in a support desk.
 * Real addresses, real names, real mistakes — because a control's defects
 * only appear against content a product would actually hold.
 */
const CONTACTS: Record<string, string> = {
  'ana.pereira@example.com': 'Ana Pereira',
  'tomas.lindqvist@example.com': 'Tomas Lindqvist',
  'wei.zhang@example.com': 'Wei Zhang',
  'nadia.haddad@example.com': 'Nadia Haddad',
  'support@example.com': 'Support',
};

const TEAM = Object.keys(CONTACTS).slice(0, 4);

const MANY = [
  ...TEAM,
  'bruno.costa@example.com',
  'carla.mendes@example.org',
  'diego.alves@example.com',
  'elena.rossi@example.net',
  'felipe.souza@example.com',
  'gabi.lima@example.org',
  'hugo.leal@example.com',
  'iris.nunes@example.net',
];

const nameFor = (address: string) => CONTACTS[address] ?? address;
const hasDomain = (text: string) => (text.includes('@') ? true : 'Needs an @');
const isSku = (text: string) => /^[A-Z]{3}-\d{4}$/.test(text);
const addressesIn = (text: string) => text.match(/[^\s@,"<>]+@[^\s,>"]+/g) ?? [];

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>
`;

const meta: Meta<TagsInputStoryArgs> = {
  title: 'Components/Tags Input',
  decorators: [
    moduleMetadata({
      imports: [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlTagsInput],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tags Input',
        description:
          'A frame of typed values, with a field that adds more. The value is a list of texts, a value that fails is held and shown rather than dropped, and the browser judges when no validator is given.',
        framework: 'Angular',
        ...ANGULAR_TAGS_INPUT_DOCS['tags-input'],
        tokens: ANGULAR_TAGS_INPUT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TagsInputStoryArgs>;

export const Playground: Story = {
  args: {
    addOnPaste: true,
    allowDuplicates: false,
    clearable: true,
    disabled: false,
    editable: false,
    invalidValues: 'keep',
    overflow: 'wrap',
    pendingOnBlur: 'commit',
    readOnly: false,
    reorderable: false,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, held: ['ana.pereira@example.com', 'jhon.company'] },
    template: `
      <sl-tags-input
        aria-label="To"
        type="email"
        placeholder="Add a recipient"
        [defaultValue]="held"
        [addOnPaste]="addOnPaste"
        [allowDuplicates]="allowDuplicates"
        [clearable]="clearable"
        [disabled]="disabled"
        [editable]="editable"
        [invalidValues]="invalidValues"
        [overflow]="overflow"
        [pendingOnBlur]="pendingOnBlur"
        [readOnly]="readOnly"
        [reorderable]="reorderable"
        [size]="size"
        [variant]="variant"
      />
    `,
  }),
};

export const Recipients: Story = {
  parameters: scenario('recipients'),
  render: () => ({
    props: { three: TEAM.slice(0, 3), to: TEAM.slice(0, 2), nameFor },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'The text is the label',
          'Each chip is the address the reader typed. Remove one and the announcement says what left and how many are left.',
          `<sl-tags-input aria-label="To" type="email" placeholder="Add a recipient" [defaultValue]="three" />`,
        )}
        ${scene(
          'A name where the value is an address',
          'formatLabel draws the chip from the value; the value a form receives — printed under the control — stays the address.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="To" type="email" [(value)]="to" [formatLabel]="nameFor" />
              <p>Value: {{ to.join(', ') }}</p>
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Validity: Story = {
  parameters: scenario('validity'),
  render: () => ({
    props: {
      held: ['ana.pereira@example.com', 'jhon.company', 'wei.zhang@example.com'],
      hasDomain,
      isSku,
      refused: '',
      onRefuse(event: { values: readonly string[]; cause: string }) {
        this['refused'] = event.cause === 'invalid' ? `Not an SKU: ${event.values.join(', ')}` : '';
      },
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Kept, marked, described',
          'jhon.company failed the validator and stayed. Hover the chip for its reason, or press the submit button of a form around it and read the browser’s own bubble.',
          `<sl-tags-input aria-label="To" type="email" [defaultValue]="held" [validateValue]="hasDomain" />`,
        )}
        ${scene(
          'Refused, for a filter operand',
          'A set filter has nowhere to put a bad identifier, so invalidValues="refuse" reports it instead: type abc and press Enter.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="SKUs" placeholder="ABC-0000" invalidValues="refuse" [defaultValue]="['ABC-1234']" [validateValue]="isSku" (valueRefuse)="onRefuse($event)" />
              @if (refused) {
                <p>{{ refused }}</p>
              }
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const PlatformValidation: Story = {
  parameters: scenario('platform-validation'),
  render: () => ({
    props: {
      addresses: ['ana.pereira@example.com', 'tomas.lindqvist', 'wei@'],
      orders: ['ORD-104233', 'ORD-1042', '104240'],
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'type="email", no validator',
          'The two marked addresses were judged by the browser’s own email grammar, and the reason on each chip is the browser’s own sentence, in the browser’s own language.',
          `<sl-tags-input aria-label="To" type="email" [defaultValue]="addresses" />`,
        )}
        ${scene(
          'pattern, no validator',
          'Order numbers are ORD- and six digits. The pattern is the input’s own attribute, applied to each value exactly as the platform applies it to one.',
          `<sl-tags-input aria-label="Order numbers" placeholder="ORD-000000" pattern="ORD-\\d{6}" [defaultValue]="orders" />`,
        )}
      </div>
    `,
  }),
};

export const Limit: Story = {
  parameters: scenario('limit'),
  render: () => ({
    props: {
      one: TEAM.slice(0, 1),
      full: TEAM.slice(0, 3),
      refused: '',
      onRefuse(event: { values: readonly string[]; cause: string }) {
        this['refused'] = event.cause === 'limit' ? `Not added: ${event.values.join(', ')}` : '';
      },
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Under the limit',
          'The counter is drawn only because max is set. Paste four addresses separated by commas and read which ones did not fit.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="Reviewers" type="email" placeholder="Add a reviewer" [defaultValue]="one" [max]="3" (valueRefuse)="onRefuse($event)" />
              @if (refused) {
                <p>{{ refused }}</p>
              }
            </div>
          `,
        )}
        ${scene(
          'Full',
          'The counter takes the accent, the root carries data-complete, and the next value typed is refused and reported rather than taken silently.',
          `<sl-tags-input aria-label="Reviewers" type="email" [defaultValue]="full" [max]="3" />`,
        )}
      </div>
    `,
  }),
};

export const Duplicates: Story = {
  parameters: scenario('duplicates'),
  render: () => ({
    props: { two: TEAM.slice(0, 2), lines: ['SKU-2201', 'SKU-2201', 'SKU-0930'] },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Refused, and shown where',
          'The text in the field is the first address in capitals. Press Enter: focus lands on the chip that already holds it and its edge takes the accent for a moment.',
          `<sl-tags-input aria-label="To" type="email" [defaultValue]="two" [inputValue]="'ANA.PEREIRA@EXAMPLE.COM'" />`,
        )}
        ${scene(
          'Allowed',
          'A picking list where the same line may be counted twice sets allowDuplicates, and the second chip stands beside the first.',
          `<sl-tags-input aria-label="Line items" allowDuplicates [defaultValue]="lines" />`,
        )}
      </div>
    `,
  }),
};

export const Paste: Story = {
  parameters: scenario('paste'),
  render: () => ({
    props: { addressesIn, delimiters: [',', ';'] },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Commas, semicolons and line breaks',
          'Paste a column copied out of a spreadsheet, or a list with semicolons: every line and every delimiter becomes a value.',
          `<sl-tags-input aria-label="Cc" type="email" placeholder="Paste a list" [delimiters]="delimiters" />`,
        )}
        ${scene(
          'A clipboard the family cannot guess',
          'Paste "Lopes, André" &lt;andre&#64;example.com&gt;, bob&#64;example.org — with split, the quoted name does not become a value of its own.',
          `<sl-tags-input aria-label="To" type="email" placeholder="Paste from another mail client" [split]="addressesIn" />`,
        )}
      </div>
    `,
  }),
};

export const Blur: Story = {
  parameters: scenario('blur'),
  render: () => ({
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'commit, keep, discard',
          'Type an address in each and press Tab. The first turns it into a value, the second leaves it in the box, the third empties it.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="To" type="email" placeholder="commit" pendingOnBlur="commit" />
              <sl-tags-input aria-label="Filter" placeholder="keep" pendingOnBlur="keep" />
              <sl-tags-input aria-label="Tags" placeholder="discard" pendingOnBlur="discard" />
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => ({
    props: { held: ['ana.pereira@example.com', 'tomas.lindqvist', 'wei.zhang@example.com'] },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Enter opens, Enter commits, Escape reverts',
          'Arrow to a chip and press Enter, or double click it. Fix the typo in tomas.lindqvist, press Enter, and the chip is judged again and loses its mark.',
          `<sl-tags-input aria-label="To" type="email" editable [defaultValue]="held" />`,
        )}
      </div>
    `,
  }),
};

export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () => ({
    props: {
      order: TEAM,
      nameFor,
      saved: '',
      onRequest(event: { reason: string; value: readonly string[] }) {
        if (event.reason !== 'keyboard') return;
        this['saved'] = `Saved: ${event.value.map(nameFor).join(' → ')}`;
      },
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Alt with an arrow',
          'Arrow to a chip, hold Alt and press an arrow: the chip moves one place and the announcement says where it landed. Only a reorder carries the reason keyboard, which is what the line under the control listens for.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="Approvers, in order" type="email" reorderable [(value)]="order" [formatLabel]="nameFor" (valueChangeRequest)="onRequest($event)" />
              @if (saved) {
                <p>{{ saved }}</p>
              }
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Locked: Story = {
  parameters: scenario('locked'),
  render: () => ({
    props: {
      held: ['support@example.com', 'ana.pereira@example.com', 'wei.zhang@example.com'],
      locked: ['support@example.com'],
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'A mandatory recipient',
          'support&#64;example.com stays whatever the reader presses: no remove button, skipped by Backspace, kept by the clear button, and still reachable by arrow.',
          `<sl-tags-input aria-label="Cc" type="email" [defaultValue]="held" [lockedValues]="locked" />`,
        )}
      </div>
    `,
  }),
};

export const Copy: Story = {
  parameters: scenario('copy'),
  render: () => ({
    props: {
      team: TEAM,
      copied: '',
      onCopy(event: { values: readonly string[]; outcome: string }) {
        this['copied'] =
          event.outcome === 'refused'
            ? 'The clipboard refused the write'
            : `Copied: ${event.values.join(', ')}`;
      },
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'One chip, or the whole list',
          'Press Ctrl+C on the empty field to copy every address joined by commas; arrow to a chip and press Ctrl+C for that one, or Ctrl+X to copy it and take it out.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="To" type="email" [defaultValue]="team" (valueCopy)="onCopy($event)" />
              @if (copied) {
                <p>{{ copied }}</p>
              }
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: () => ({
    props: { many: MANY },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'wrap: three rows, then scroll',
          'Twelve addresses wrap to three rows and the fourth scrolls into view — the wheel and the arrow keys reach it, and every chip stays in the DOM.',
          `<sl-tags-input aria-label="Cc" type="email" [defaultValue]="many" />`,
        )}
        ${scene(
          'collapse: one line that opens where the reader is',
          'At rest, one line and a +N. Click into the control or Tab to it and every chip appears; leave and it folds back. There is no popup, and none is needed.',
          `<sl-tags-input aria-label="Cc" type="email" overflow="collapse" [defaultValue]="many" />`,
        )}
      </div>
    `,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { two: TEAM.slice(0, 2) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'sm, md, lg',
          'Three control heights and one chip: the chip keeps the small step at every size, because it is a chip and not a control.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="To" type="email" placeholder="Small" size="sm" [defaultValue]="two" />
              <sl-tags-input aria-label="To" type="email" placeholder="Medium" size="md" [defaultValue]="two" />
              <sl-tags-input aria-label="To" type="email" placeholder="Large" size="lg" [defaultValue]="two" />
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: { one: TEAM.slice(0, 1), two: TEAM.slice(0, 2), other: TEAM.slice(2, 4) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'outline and subtle',
          'An edge for a form, and a ground for a panel that already has one.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="To" type="email" variant="outline" [defaultValue]="one" />
              <sl-tags-input aria-label="To" type="email" variant="subtle" [defaultValue]="one" />
            </div>
          `,
        )}
        ${scene(
          'plain, in the row it exists for',
          'No edge, no lift and no ground: the row is the ground, and a resting shadow would draw a cell where there is none.',
          `
            <div class="slotted-demo-rows">
              <span>Watchers</span>
              <sl-tags-input aria-label="Watchers" type="email" variant="plain" [defaultValue]="two" />
              <span>Approvers</span>
              <sl-tags-input aria-label="Approvers" type="email" variant="plain" [defaultValue]="other" />
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { one: TEAM.slice(0, 1), two: TEAM.slice(0, 2) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'disabled and readOnly',
          'Disabled answers nothing and keeps its values legible; read-only keeps the chips at full ink, the caret and the copy, and withholds every remove control.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="Disabled" type="email" disabled [defaultValue]="one" />
              <sl-tags-input aria-label="Read-only" type="email" readOnly [defaultValue]="two" />
            </div>
          `,
        )}
        ${scene(
          'required and invalid',
          'required is written on the input only while the list is empty; invalid retints the border and the focus ring together, whether the consumer said so or a value failed.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="Required" type="email" required placeholder="Add a recipient" />
              <sl-tags-input aria-label="Invalid" type="email" invalid required placeholder="Add a recipient" />
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: () => ({
    props: {
      long: [
        'quality-assurance-and-release-management@subsidiary.example.com',
        'Aufmerksamkeitsdefizithyperaktivitätsstörung',
      ],
      narrow: TEAM.slice(0, 3),
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'An address longer than the frame',
          'The chip truncates and the value stays whole in the accessibility tree and to a page search: truncation never removes content from the DOM.',
          `<sl-tags-input aria-label="To" type="email" [defaultValue]="long" />`,
        )}
        ${scene(
          'In a narrow column',
          'At 360 pixels the row wraps and the longest chip truncates, and the frame stays the frame. Narrower than 120 pixels — a table cell — a chip narrower than a word is a shape, so the chips withdraw and the counter answers instead; the width is watched rather than queried, because a container query would stop the frame’s width depending on its contents.',
          `
            <div class="slotted-demo-measure">
              <sl-tags-input aria-label="To" type="email" [defaultValue]="narrow" />
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { three: TEAM.slice(0, 3) },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'One tab stop, and the keys inside it',
          'Tab reaches the field once. Backspace from the empty field moves to the last chip and removes nothing; a second press removes it. ArrowLeft and ArrowRight walk the row, Enter edits, Alt with an arrow moves, Escape returns to the field, and any letter types itself there.',
          `<sl-tags-input aria-label="To" type="email" editable reorderable [defaultValue]="three" />`,
        )}
      </div>
    `,
  }),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: () => ({
    props: { one: TEAM.slice(0, 1), support: ['support@example.com'] },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Named, described and in error',
          'One hidden input per value under the name to. The field carries the label, the description and the error by ID, and the family’s own verdict blocks the native submit as well.',
          `
            <div slField [invalid]="true" [required]="true">
              <label slFieldLabel>To</label>
              <span slFieldDescription>Everyone who should see this message.</span>
              <sl-tags-input name="to" type="email" placeholder="Add a recipient" />
              <span slFieldError>Name at least one recipient</span>
            </div>
          `,
        )}
        ${scene(
          'Beside the controls it sits with',
          'A message being composed: To, Cc with a locked support address, and the same frame, the same height when empty and the same focus ring as every other control on the form.',
          `
            <div slField [required]="true">
              <label slFieldLabel>To</label>
              <sl-tags-input name="to" type="email" placeholder="Add a recipient" [defaultValue]="one" />
            </div>
            <div slField>
              <label slFieldLabel>Cc</label>
              <sl-tags-input name="cc" type="email" placeholder="Add a recipient" [defaultValue]="support" [lockedValues]="support" />
            </div>
          `,
        )}
      </div>
    `,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: {
      one: TEAM.slice(0, 1),
      two: TEAM.slice(1, 2),
      team: TEAM,
      contacts: Object.keys(CONTACTS),
    },
    moduleMetadata: {
      providers: [provideTagsInputDefaults({ size: 'sm', variant: 'subtle' })],
    },
    template: `
      <div class="slotted-demo-grid">
        ${scene(
          'Defaults an application sets once',
          'provideTagsInputDefaults carries every axis; a binding written on one control still wins over it, which is the resolution order every family declares. The words come from the language in force.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input aria-label="From the provider" type="email" [defaultValue]="one" />
              <sl-tags-input aria-label="Overridden" type="email" variant="outline" [defaultValue]="two" />
            </div>
          `,
        )}
        ${scene(
          'The instance, and the browser’s own completion',
          'list names a datalist, so the browser draws its own suggestions with no popup of the family’s; exportAs gives the template the component, so a button beside it can take the whole list at once under the reason programmatic.',
          `
            <div class="slotted-demo-stack">
              <sl-tags-input #to="slTagsInput" aria-label="To" type="email" list="contacts" placeholder="Add a recipient" />
              <datalist id="contacts">
                @for (address of contacts; track address) {
                  <option [value]="address"></option>
                }
              </datalist>
              <button type="button" (click)="to.setValue(team, 'programmatic')">Add the whole team</button>
            </div>
          `,
        )}
      </div>
    `,
  }),
};
