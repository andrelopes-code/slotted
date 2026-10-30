import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ReactiveFormsModule } from '@angular/forms';
import { SlCheckboxGroup } from '@slotted/angular/checkbox-group';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { SlGrid } from '@slotted/angular/grid';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCheckbox } from './checkbox';
import type { CheckboxLabelPlacement, CheckboxSize } from './checkbox-defaults';
import { SlCheckboxDescription } from './checkbox-parts';
import { ANGULAR_CHECKBOX_DOCS, ANGULAR_CHECKBOX_TOKENS } from './checkbox.docs';

interface CheckboxStoryArgs {
  disabled: boolean;
  indeterminate: boolean;
  labelPlacement: CheckboxLabelPlacement;
  readOnly: boolean;
  size: CheckboxSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CHECKBOX_DOCS.checkbox.scenes, {
    playground: Playground,
    sizes: Sizes,
    tile: Tile,
    states: States,
    indeterminate: Indeterminate,
    placement: Placement,
    description: Description,
    field: InsideAField,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlCheckbox,
  SlCheckboxDescription,
  SlCheckboxGroup,
  SlField,
  SlFieldGroup,
  SlFieldGroupLegend,
  SlFieldLabel,
  SlGrid,
  SlRadio,
  SlRadioGroup,
  SlText,
];

const meta: Meta<CheckboxStoryArgs> = {
  title: 'Components/Checkbox',
  component: SlCheckbox,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Checkbox',
        description:
          'One choice, ticked or not, around a native input that keeps the value, the name and the platform’s whole keyboard — with the mark drawn as a mask beside it rather than as a character inside it.',
        framework: 'Angular',
        ...ANGULAR_CHECKBOX_DOCS.checkbox,
        tokens: ANGULAR_CHECKBOX_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CheckboxStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 */
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

/** A narrow column, for showing what a control does below 320 pixels. */
const measure = (body: string) => `<div class="slotted-demo-measure">${body}</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    indeterminate: false,
    labelPlacement: 'end',
    readOnly: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slCheckbox
          defaultChecked
          [size]="size"
          [labelPlacement]="labelPlacement"
          [indeterminate]="indeterminate"
          [disabled]="disabled"
          [readOnly]="readOnly"
        >
          Send receipt
          <p slCheckboxDescription>We will send the receipt by email.</p>
        </div>
      </div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The three steps on their own',
        'The square, the type and the gap all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts.',
        `<div slCheckbox size="sm" defaultChecked>Compact</div>
         <div slCheckbox size="md" defaultChecked>Default</div>
         <div slCheckbox size="lg" defaultChecked>Comfortable</div>`,
      ) +
        scene(
          'Inside a group, the group decides',
          'A small group holding a medium box is a group and a control disagreeing about one row, so the box reads the group’s step before the application token’s.',
          `<div slCheckboxGroup size="sm" [defaultValue]="['a']">
             <div slCheckbox value="a">Compact because the group is</div>
             <div slCheckbox value="b">And this one too</div>
           </div>
           <div slCheckboxGroup size="lg" [defaultValue]="['a']">
             <div slCheckbox value="a">Comfortable because the group is</div>
           </div>`,
        ),
    ),
  }),
};

export const Tile: Story = {
  parameters: scenario('tile'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The whole frame is the target',
        'Click the description, the empty space, the edge — the label’s hit area covers the surface, so a tile is one target rather than a box with text beside it.',
        `<div slGrid [gap]="4" minItemWidth="sm">
           <div slCheckbox variant="tile" defaultChecked>
             Daily backup
             <p slCheckboxDescription>One copy per day, kept for thirty days.</p>
           </div>
           <div slCheckbox variant="tile">
             Audit log
             <p slCheckboxDescription>Who changed what, and when, exportable as CSV.</p>
           </div>
           <div slCheckbox variant="tile" disabled>
             Secondary region
             <p slCheckboxDescription>Available from the Scale plan.</p>
           </div>
         </div>`,
        'block',
      ) +
        scene(
          'Chosen is an edge before it is a tint',
          'Switch the toolbar to high contrast: the tint flattens to white and the two-pixel accent edge is what still says which tile was chosen. Hovering a chosen tile deepens that edge rather than its ground, because the tint is already the last step the tone has.',
          `<div slGrid [columns]="1" [gap]="4">
             <div slCheckbox variant="tile" defaultChecked>Chosen</div>
             <div slCheckbox variant="tile">Not chosen</div>
             <div slCheckbox variant="tile" defaultChecked invalid>Chosen and invalid</div>
             <div slCheckbox variant="tile" defaultChecked readOnly>
               Chosen and read-only
             </div>
           </div>`,
          'block',
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
        'What a reader may still change',
        'Hover the first two and press one: the ground answers the pointer and goes one step further under it, and the ring on focus sits clear of the border rather than on it.',
        `<div slCheckbox>Default</div>
         <div slCheckbox defaultChecked>Checked</div>
         <div slCheckbox indeterminate>Partially checked</div>`,
      ) +
        scene(
          'What a reader may not',
          'Read-only keeps full-strength ink, its ring and its tab stop, because the value is real and still submitted. Disabled loses all three, and stays legible rather than merely faded.',
          `<div slCheckbox defaultChecked readOnly>Somente leitura</div>
           <div slCheckbox disabled>Desativado</div>
           <div slCheckbox defaultChecked disabled>Desativado e marcado</div>`,
        ) +
        scene(
          'Invalid says it twice',
          'The border reddens and thickens together, because the high-contrast scheme paints every border the same black and colour alone would leave the two states identical there.',
          `<div slCheckbox invalid>Choose at least one</div>
           <div slCheckbox invalid defaultChecked>Invalid and checked</div>`,
        ),
    ),
  }),
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => ({
    props: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], chosen: ['mon', 'tue'] },
    template: grid(
      2,
      scene(
        'A state the consumer owns',
        'The dash is drawn from the same mask property as the check, pointed at another glyph, and the form still submits a boolean rather than a third value.',
        `<div slCheckbox indeterminate>Partially checked</div>
         <div slCheckbox indeterminate>
           With description
           <p slCheckboxDescription>Nothing changes in what is sent.</p>
         </div>`,
      ) +
        scene(
          'A state the group derives',
          'Tick the first box and the whole set follows; untick any one of them and the first goes back to the dash, because it reads the set rather than keeping a state of its own.',
          `<div slCheckboxGroup [allValues]="days" [defaultValue]="chosen">
             <div slCheckbox parent>Every weekday</div>
             <div slCheckbox value="mon">Monday</div>
             <div slCheckbox value="tue">Tuesday</div>
             <div slCheckbox value="wed">Wednesday</div>
             <div slCheckbox value="thu">Thursday</div>
             <div slCheckbox value="fri">Sexta</div>
           </div>`,
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
        'The box before the label',
        'The default, and the arrangement a form uses: the box starts the row, the label owns the gap after it, and the description aligns under the text.',
        `<div slCheckbox defaultChecked>
           Receive notices
           <p slCheckboxDescription>The description follows the label.</p>
         </div>
         <div slCheckbox>Receive weekly summary</div>`,
      ) +
        scene(
          'The box after the label',
          'The controls line up with each other at the end of the row rather than each one hugging its own label, which is what a settings list needs and what a column of different-length labels would otherwise lose.',
          `<div slCheckbox labelPlacement="start" defaultChecked>Email notifications</div>
           <div slCheckbox labelPlacement="start">SMS notifications</div>
           <div slCheckbox labelPlacement="start">In-app notifications</div>`,
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
        'Described, and not named',
        'A screen reader announces the label as the name and the paragraph as the description, and clicking the paragraph toggles nothing — which is why it is projected outside the label element.',
        `<div slCheckbox>
           Receive email notices
           <p slCheckboxDescription>
             One summary per day, never more than one. Can be turned off at any time.
           </p>
         </div>`,
      ) +
        scene(
          'At the smallest step, in a narrow column',
          'The description drops one step below the label’s type and keeps its alignment under the text, so a set of options in a 320-pixel drawer still reads as a list rather than as a paragraph.',
          measure(
            `<div slCheckboxGroup size="sm">
               <div slCheckbox value="a">
                 Keep for 90 days
                 <p slCheckboxDescription>After that the note is archived.</p>
               </div>
               <div slCheckbox value="b">
                 Apply to the whole group
                 <p slCheckboxDescription>Applies to all branches.</p>
               </div>
             </div>`,
          ),
        ),
    ),
  }),
};

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A set of boxes under one legend',
        'The fieldset and its legend are what group and name the set, so the group inside it withdraws its own role rather than announcing the same set twice.',
        `<fieldset slFieldGroup required>
           <legend slFieldGroupLegend>Notifications</legend>
           <div slCheckboxGroup name="alerts" [defaultValue]="['approved']">
             <div slCheckbox value="approved">Order approved</div>
             <div slCheckbox value="refused">Order refused</div>
             <div slCheckbox value="shipped">Order shipped</div>
           </div>
         </fieldset>`,
      ) +
        scene(
          'A disabled group, from the platform',
          'Only the fieldset carries disabled. Every box inside it is disabled by the browser with nothing passed down, and each label dims from its own control’s state.',
          `<fieldset slFieldGroup disabled>
             <legend slFieldGroupLegend>While the account is suspended</legend>
             <div slCheckboxGroup [defaultValue]="['approved']">
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
    template: grid(
      2,
      scene(
        'A label that wraps',
        'The box stays on the first line box of the label rather than centring itself against the whole block, which is where align-items would put it as soon as the text reaches a second line.',
        `<div slCheckbox defaultChecked>
           I agree to receive communications about contract changes, delivery deadlines and
           changes to the returns policy of this and the other stores in the group.
           <p slCheckboxDescription>
             The box stays on the first line of the label, not in the middle of the text block.
           </p>
         </div>`,
      ) +
        scene(
          'Content the family did not choose',
          'An unbroken token breaks instead of taking the page’s horizontal scrollbar with it, and a right-to-left label mirrors the whole row — the same component, not a rearranged one.',
          measure(
            `<div slCheckbox>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0</div>
             <div slCheckbox defaultChecked dir="rtl">
               أوافق على تلقي رسائل حول التغييرات في العقد ومواعيد التسليم.
             </div>`,
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
        'The element behind the instance',
        'exportAs reaches the component and inputElement reaches the input, so focus() and click() are the platform’s own and no imperative handle is invented for them.',
        `<div slCheckbox #box="slCheckbox">A box the button reaches</div>
         <button type="button" slButton variant="outline" size="sm" (click)="box.inputElement.focus()">
           Focus the box
         </button>`,
      ) +
        scene(
          'The root is the consumer’s own element',
          'Angular pays one element for the root where React pays none: the host is the wrapper, so a set of choices can be a real list with each box written as a list item.',
          `<ul class="slotted-demo-list">
             <li slCheckbox defaultChecked>A list item that is also a box</li>
             <li slCheckbox>And another below it</li>
           </ul>`,
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
        'The platform’s whole table',
        'Tab reaches the box, Space toggles it, and Enter submits the form rather than the control. No key listener exists in this family, which is why the behaviour is already translated and already mirrored.',
        `<div slCheckbox>Tab to here, then space</div>
         <div slCheckbox defaultChecked>And again</div>`,
      ) +
        scene(
          'A box the browser disabled is skipped',
          'The browser skips it because it is natively disabled, so the tab order needs no bookkeeping from the family and stays right when the set changes at runtime.',
          `<div slCheckbox>Available</div>
           <div slCheckbox disabled>Unavailable</div>
           <div slCheckbox>Available again</div>`,
        ),
    ),
  }),
};

/* ── Checkbox beside Radio, every state, every density, every scheme ──────
 *
 * The acceptance picture for the selection controls (CK1–CK5): the square and
 * the circle side by side so a reader sees, in one place, that the two read
 * the same scale, the same edge, the same halo and the same motion. Not a
 * contract scenario, so it has no reference-page scene; it is the picture the
 * review asked for.
 */

const COMPARISON_SCHEMES = ['light', 'dark', 'high-contrast'] as const;
const COMPARISON_DENSITIES = ['comfortable', 'compact', 'dense'] as const;
const COMPARISON_STATES = [
  'default',
  'hover',
  'focus-visible',
  'checked',
  'indeterminate',
  'disabled',
  'invalid',
] as const;
type ComparisonState = (typeof COMPARISON_STATES)[number];

const COMPARISON_LABELS: Record<ComparisonState, string> = {
  default: 'default',
  hover: 'hover — move the pointer over a box or a circle',
  'focus-visible': 'focus-visible — the first cell holds focus; Tab moves it',
  checked: 'checked',
  indeterminate: 'indeterminate',
  disabled: 'disabled',
  invalid: 'invalid',
};

const comparisonCell = (
  scheme: (typeof COMPARISON_SCHEMES)[number],
  density: (typeof COMPARISON_DENSITIES)[number],
  state: ComparisonState,
) => {
  const key = `${scheme}-${density}-${state}`;
  const flags = `${state === 'disabled' ? ' disabled' : ''}${state === 'invalid' ? ' invalid' : ''}`;
  const checkbox = `<div slCheckbox${flags}${state === 'checked' ? ' defaultChecked' : ''}${
    state === 'indeterminate' ? ' indeterminate' : ''
  }>Caixa</div>`;
  const radio =
    state === 'indeterminate'
      ? `<span slText size="sm" tone="muted">no equivalent</span>`
      : `<div slRadioGroup name="${key}" aria-label="Radio ${key}"${flags}${
          state === 'checked' ? ' defaultValue="a"' : ''
        }><div slRadio value="a">Radio</div></div>`;
  return `<div data-slotted-density="${density}"${
    state === 'focus-visible' ? ' data-comparison-focus' : ''
  }><div class="slotted-demo-stage" data-layout="row">${checkbox}${radio}</div></div>`;
};

const comparisonMatrix = (scheme: (typeof COMPARISON_SCHEMES)[number]) =>
  `<div class="slotted-demo-surface" data-flow="stack" data-surface="scheme" data-slotted-scheme="${scheme}">
    <span slText size="sm" tone="muted">${scheme}</span>
    <div class="slotted-matrix-scroll" role="region" aria-label="Component comparison" tabindex="0">
      <table class="slotted-matrix">
        <thead><tr><th class="slotted-matrix__corner" aria-hidden="true"></th>${COMPARISON_DENSITIES.map(
          (density) => `<th class="slotted-matrix__heading" scope="col">${density}</th>`,
        ).join('')}</tr></thead>
        <tbody>${COMPARISON_STATES.map(
          (state) =>
            `<tr><th class="slotted-matrix__row-label" scope="row">${COMPARISON_LABELS[state]}</th>${COMPARISON_DENSITIES.map(
              (density) =>
                `<td class="slotted-matrix__cell">${comparisonCell(scheme, density, state)}</td>`,
            ).join('')}</tr>`,
        ).join('')}</tbody>
      </table>
    </div>
  </div>`;

export const Comparison: Story = {
  render: () => ({
    template: `<div class="slotted-demo-stage" data-layout="stack">${COMPARISON_SCHEMES.map(
      comparisonMatrix,
    ).join('')}</div>`,
  }),
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('[data-comparison-focus] input')?.focus();
  },
};
