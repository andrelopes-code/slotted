import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ReactiveFormsModule } from '@angular/forms';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlGrid } from '@slotted/angular/grid';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCheckboxGroup } from './checkbox-group';
import type { CheckboxGroupOrientation, CheckboxGroupSize } from './checkbox-group-defaults';
import { ANGULAR_CHECKBOX_GROUP_DOCS, ANGULAR_CHECKBOX_GROUP_TOKENS } from './checkbox-group.docs';

interface CheckboxGroupStoryArgs {
  disabled: boolean;
  invalid: boolean;
  orientation: CheckboxGroupOrientation;
  readOnly: boolean;
  size: CheckboxGroupSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CHECKBOX_GROUP_DOCS.checkboxGroup.scenes, {
    playground: Playground,
    orientation: Orientation,
    tile: Tile,
    parent: Parent,
    states: States,
    count: Count,
    field: InsideAFieldGroup,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlCheckbox,
  SlCheckboxGroup,
  SlField,
  SlFieldGroup,
  SlFieldGroupLegend,
  SlFieldLabel,
  SlText,
  SlGrid,
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

const meta: Meta<CheckboxGroupStoryArgs> = {
  title: 'Components/CheckboxGroup',
  component: SlCheckboxGroup,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Checkbox Group',
        description:
          'A set of choices and the array behind it, with a parent box that is derived from the set rather than kept beside it — and a count of what is chosen published where the field already draws one.',
        framework: 'Angular',
        ...ANGULAR_CHECKBOX_GROUP_DOCS.checkboxGroup,
        tokens: ANGULAR_CHECKBOX_GROUP_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CheckboxGroupStoryArgs>;

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

const DAY_BOXES = `<div slCheckbox value="mon">Monday</div>
  <div slCheckbox value="tue">Tuesday</div>
  <div slCheckbox value="wed">Wednesday</div>
  <div slCheckbox value="thu">Thursday</div>
  <div slCheckbox value="fri">Sexta</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    invalid: false,
    orientation: 'vertical',
    readOnly: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, days: DAYS, chosen: ['mon', 'wed'] },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slCheckboxGroup
          [allValues]="days"
          [defaultValue]="chosen"
          [size]="size"
          [orientation]="orientation"
          [disabled]="disabled"
          [invalid]="invalid"
          [readOnly]="readOnly"
        >
          ${DAY_BOXES}
        </div>
      </div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    props: { days: DAYS, chosen: ['mon'], pair: ['mon', 'wed'] },
    template: grid(
      2,
      scene(
        'Stacked, which is what a form uses',
        'The distance between two choices is the control gap the theme restates per density, so the same set reads at the same rhythm in a comfortable page and a dense table.',
        `<div slCheckboxGroup [defaultValue]="chosen">
           <div slCheckbox value="mon">Monday</div>
           <div slCheckbox value="tue">Tuesday</div>
           <div slCheckbox value="wed">Wednesday</div>
         </div>`,
      ) +
        scene(
          'In a row that wraps',
          'Two choices sit twice as far apart as a box does from its own label, so the eye groups each box with its text rather than with the option beside it. Narrow the window: the row wraps rather than clipping.',
          `<div slCheckboxGroup orientation="horizontal" [defaultValue]="pair">${DAY_BOXES}</div>`,
        ),
    ),
  }),
};

export const Tile: Story = {
  parameters: scenario('tile'),
  render: () => ({
    template: grid(
      1,
      scene(
        'One decision for the whole set',
        'The group states the variant once and every choice under it is framed. Click anywhere inside a tile: the target is the surface, not the sixteen pixels of the box.',
        `<div slCheckboxGroup variant="tile" [defaultValue]="['pix']">
           <div slGrid [gap]="4" minItemWidth="sm">
             <div slCheckbox value="pix">
               Zelle
               <p slCheckboxDescription>Instant settlement, no per-transaction fee.</p>
             </div>
             <div slCheckbox value="card">
               Credit card
               <p slCheckboxDescription>Installments up to twelve times.</p>
             </div>
             <div slCheckbox value="slip">
               ACH transfer
               <p slCheckboxDescription>Clears within three business days.</p>
             </div>
           </div>
         </div>`,
        'block',
      ),
    ),
  }),
};

export const Parent: Story = {
  parameters: scenario('parent'),
  render: () => ({
    props: { days: DAYS, chosen: ['mon', 'tue'], three: DAYS.slice(0, 3) },
    template: grid(
      2,
      scene(
        'Derived from the set, not kept beside it',
        'Tick the first box and the whole set follows; untick any child and the first returns to the dash. It holds no state of its own, so it can never disagree with what its children show.',
        `<div slCheckboxGroup [allValues]="days" [defaultValue]="chosen">
           <div slCheckbox parent>Every weekday</div>
           ${DAY_BOXES}
         </div>`,
      ) +
        scene(
          'Every value already chosen',
          'With the whole set selected the parent is ticked rather than mixed, and its next request empties the selection instead of toggling one value of its own.',
          `<div slCheckboxGroup [allValues]="three" [defaultValue]="three">
             <div slCheckbox parent>Every day</div>
             <div slCheckbox value="mon">Monday</div>
             <div slCheckbox value="tue">Tuesday</div>
             <div slCheckbox value="wed">Wednesday</div>
           </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { chosen: ['a'] },
    template: grid(
      3,
      scene(
        'Invalid, said once for the set',
        'Every box reddens and thickens its border together, and the sentence that says what is wrong belongs to the field group above them rather than to any one option.',
        `<div slCheckboxGroup invalid required>
           <div slCheckbox value="a">Choose at least one</div>
           <div slCheckbox value="b">Second option</div>
         </div>`,
      ) +
        scene(
          'Read-only, which is not disabled',
          'Every box keeps its tab stop, its ring and its ink because the values are real and still submitted. Only the ground of the unchosen options and the pointer say they are not the reader’s to move.',
          `<div slCheckboxGroup readOnly [defaultValue]="chosen">
             <div slCheckbox value="a">Subscribed</div>
             <div slCheckbox value="b">Not subscribed</div>
           </div>`,
        ) +
        scene(
          'Disabled, from the platform',
          'One attribute on the group reaches every box as the native one, so the boxes leave the tab order and the form together rather than one input at a time.',
          `<div slCheckboxGroup disabled [defaultValue]="chosen">
             <div slCheckbox value="a">Whole group disabled</div>
             <div slCheckbox value="b">Another option</div>
           </div>`,
        ),
    ),
  }),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => ({
    props: { days: DAYS, chosen: ['mon', 'wed'], tags: ['a'] },
    template: grid(
      2,
      scene(
        'Where a reader already looks for a count',
        'The number sits in the spare column of the field’s label row, which is where a text field puts its character count — the same channel, for the same reason.',
        `<div slField>
           <label slFieldLabel>Dias de coleta</label>
           <div slCheckboxGroup showCount [allValues]="days" [defaultValue]="chosen">
             ${DAY_BOXES}
           </div>
         </div>`,
      ) +
        scene(
          'Without a set to measure against',
          'With no allValues there is no total, so the count is the number chosen and nothing else. Tick a box and watch it move without a denominator appearing from nowhere.',
          `<div slField>
             <label slFieldLabel>Etiquetas</label>
             <div slCheckboxGroup showCount [defaultValue]="tags">
               <div slCheckbox value="a">Urgent</div>
               <div slCheckbox value="b">Fragile</div>
               <div slCheckbox value="c">Refrigerated</div>
             </div>
           </div>`,
        ),
    ),
  }),
};

export const InsideAFieldGroup: Story = {
  parameters: scenario('field'),
  render: () => ({
    props: { chosen: ['approved'] },
    template: grid(
      2,
      scene(
        'The legend names the set',
        'The fieldset and its legend group and name the options, so this group renders no role of its own — a second one named by the same legend would announce the same set twice.',
        `<fieldset slFieldGroup required>
           <legend slFieldGroupLegend>Notifications</legend>
           <div slCheckboxGroup name="alerts" [defaultValue]="chosen">
             <div slCheckbox value="approved">Order approved</div>
             <div slCheckbox value="refused">Order refused</div>
             <div slCheckbox value="shipped">Order shipped</div>
           </div>
         </fieldset>`,
      ) +
        scene(
          'One attribute disables the whole set',
          'Only the fieldset carries disabled: the browser disables every box inside it with nothing passed down, and each label dims from its own control’s state.',
          `<fieldset slFieldGroup disabled size="sm">
             <legend slFieldGroupLegend>While the account is suspended</legend>
             <div slCheckboxGroup [defaultValue]="chosen">
               <div slCheckbox value="approved">Order approved</div>
               <div slCheckbox value="refused">Order refused</div>
             </div>
           </fieldset>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { chosen: ['a'], days: DAYS, one: ['mon'] },
    template: grid(
      2,
      scene(
        'Options longer than one line',
        'Every box stays on the first line of its own label, and the set keeps its rhythm even when one option runs to three lines and the next to one.',
        `<div slCheckboxGroup [defaultValue]="chosen">
           <div slCheckbox value="a">
             I authorize the use of browsing data to personalize the recommendations of this and the
             other stores in the group.
           </div>
           <div slCheckbox value="b">And also to measure campaign reach.</div>
         </div>`,
      ) +
        scene(
          'A row that has run out of room',
          'At 360 pixels the horizontal set wraps to as many rows as it needs rather than scrolling, because a set of options is not a scroll region and the last option has to be visible.',
          measure(
            `<div slCheckboxGroup orientation="horizontal" size="sm" [defaultValue]="one">
               ${DAY_BOXES}
             </div>`,
          ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { chosen: ['a'] },
    template: grid(
      2,
      scene(
        'A set of choices that is a real list',
        'Angular pays one element for the root where React pays none: the host is the wrapper, so the markup a screen reader walks is a list of items rather than a stack of divs.',
        `<ul slCheckboxGroup class="slotted-demo-list" [defaultValue]="chosen">
           <li slCheckbox value="a">A list item</li>
           <li slCheckbox value="b">And another below it</li>
         </ul>`,
      ) +
        scene(
          'The instance a template can reach',
          'exportAs hands the template the group itself, so a caption can read the resolved step or the current selection without a second source of truth.',
          `<div slCheckboxGroup #set="slCheckboxGroup" [defaultValue]="chosen">
             <div slCheckbox value="a">Primeira</div>
             <div slCheckbox value="b">Segunda</div>
           </div>
           <span slText size="sm" tone="muted">escolhidas: {{ set.selection().length }}</span>`,
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
        'One tab stop per box',
        'Tab reaches every option in turn and Space toggles the one that has focus, because a checkbox is one choice made on its own. No key listener exists in this family.',
        `<div slCheckboxGroup>
           <div slCheckbox value="a">Tab to here</div>
           <div slCheckbox value="b">And again to here</div>
           <div slCheckbox value="c">And once more</div>
         </div>`,
      ) +
        scene(
          'A disabled option is still skipped',
          'The browser skips it because it is natively disabled, so the tab order needs no bookkeeping from the group and stays right when the set changes at runtime.',
          `<div slCheckboxGroup>
             <div slCheckbox value="a">Available</div>
             <div slCheckbox value="b" disabled>Unavailable</div>
             <div slCheckbox value="c">Available again</div>
           </div>`,
        ),
    ),
  }),
};
