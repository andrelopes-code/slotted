import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTextarea } from './textarea';
import type { TextareaResize, TextareaSize, TextareaVariant } from './textarea-defaults';
import { ANGULAR_TEXTAREA_DOCS, ANGULAR_TEXTAREA_TOKENS } from './textarea.docs';

interface TextareaStoryArgs {
  autoSize: boolean;
  maxRows: number;
  mono: boolean;
  resize: TextareaResize;
  rows: number;
  size: TextareaSize;
  variant: TextareaVariant;
}

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSJ9';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TEXTAREA_DOCS.textarea.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    'auto-size': AutoSize,
    resize: Resize,
    states: States,
    count: Count,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const DIRECTIVES = [
  ReactiveFormsModule,
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlTextarea,
];

const meta: Meta<TextareaStoryArgs> = {
  title: 'Components/Textarea',
  component: SlTextarea,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Textarea',
        description:
          'Many lines of text, in the element that already holds them — with a floor, a ceiling and a platform that grows the box without measuring anything on the main thread.',
        framework: 'Angular',
        ...ANGULAR_TEXTAREA_DOCS.textarea,
        tokens: ANGULAR_TEXTAREA_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TextareaStoryArgs>;

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
    autoSize: false,
    maxRows: 8,
    mono: false,
    resize: 'block',
    rows: 3,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div slField>
          <label slFieldLabel>Notes</label>
          <textarea
            slTextarea
            [size]="size"
            [variant]="variant"
            [mono]="mono"
            [resize]="resize"
            [autoSize]="autoSize"
            [rows]="rows"
            [maxRows]="maxRows"
            placeholder="Describe what happened"
          ></textarea>
          <span slFieldDescription>Appears in the ticket history.</span>
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
        'The block padding is derived from the control height and the control’s own line box, so a one-row textarea is exactly as tall as an input of the same step at every density.',
        `<textarea slTextarea size="sm" [rows]="2">Compact</textarea>
         <textarea slTextarea size="md" [rows]="2">Default</textarea>
         <textarea slTextarea size="lg" [rows]="2">Comfortable</textarea>`,
      ) +
        scene(
          'Inside a field, the field decides',
          'A small field holding a medium control is a field and a control disagreeing about one row, so the control reads the field’s step before the application token’s.',
          `<div slField size="sm">
             <label slFieldLabel>Nota interna</label>
             <textarea slTextarea [rows]="2">Retirar na doca 3.</textarea>
           </div>
           <div slField size="lg">
             <label slFieldLabel>Public description</label>
             <textarea slTextarea [rows]="2">Delivery within two business days.</textarea>
           </div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A frame that takes the ground it is placed on',
        'outline paints no ground of its own and subtle sinks into the page, so the same control reads correctly on a page, inside a card and inside a sunken panel.',
        `<textarea slTextarea [rows]="2">outline</textarea>
         <textarea slTextarea variant="subtle" [rows]="2">subtle</textarea>`,
      ) +
        scene(
          'No border until it is used, and a payload in monospace',
          'plain keeps exactly the same box and shows its edge on hover, and mono sets the value in the monospaced family with tabular figures for a payload or a template.',
          `<textarea slTextarea variant="plain" [rows]="2">plain</textarea>
           <textarea slTextarea mono variant="subtle" [rows]="2">{{ '{' }} "order": 20260442 {{ '}' }}</textarea>`,
        ),
    ),
  }),
};

export const AutoSize: Story = {
  parameters: scenario('auto-size'),
  render: () => ({
    template: grid(
      2,
      scene(
        'One row until there is more to say',
        'Type into it: the box grows a line at a time and stops at four, then scrolls. Nothing is measured on the main thread — the whole behavior is one CSS declaration.',
        `<textarea slTextarea autoSize [rows]="1" [maxRows]="4" placeholder="Start writing"></textarea>
         <textarea slTextarea autoSize [rows]="1" [maxRows]="4">The control grows with its content up to the four-line ceiling and scrolls after it, instead of pushing the page out from under the cursor.</textarea>`,
      ) +
        scene(
          'A ceiling that cannot be forgotten',
          'maxRows defaults to twelve rather than to nothing, because a control that grows forever pushes the page out from under the caret — the defect every auto-grow implementation ships first.',
          `<textarea slTextarea autoSize [rows]="1">No ceiling declared: the default applies.</textarea>
           <textarea slTextarea [rows]="3">No auto-size: the height is the one rows gives.</textarea>`,
        ),
    ),
  }),
};

export const Resize: Story = {
  parameters: scenario('resize'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Three axes, and the one that is safe',
        'Drag the corner of each: block only grows downward, none offers no handle at all, and both also widens — which is offered and is not the default, because a control wider than its field breaks the field’s grid.',
        `<textarea slTextarea resize="block" [rows]="2">block</textarea>
         <textarea slTextarea resize="none" [rows]="2">none</textarea>
         <textarea slTextarea resize="both" [rows]="2">both</textarea>`,
      ) +
        scene(
          'A control that sizes itself keeps no handle',
          'The two would disagree on the next keystroke: the handle fixes a height and field-sizing computes one. autoSize wins, and the handle is withdrawn rather than left to fight.',
          `<textarea slTextarea autoSize resize="both" [rows]="1">autoSize with resize both requested</textarea>
           <textarea slTextarea readonly [rows]="2">Read-only keeps the handle</textarea>`,
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
        'Invalid, and what says so besides the border',
        'The border is the quietest part of it: aria-invalid announces the state and the field’s error says it in words, because in the high-contrast scheme the border cannot carry it at all.',
        `<div slField invalid>
           <label slFieldLabel>Return reason</label>
           <textarea slTextarea [rows]="2">The carrier details are missing.</textarea>
           <span slFieldError>Enter the carrier's EIN.</span>
         </div>`,
      ) +
        scene(
          'Read-only keeps its handle; disabled does not',
          'The commonest thing a read-only textarea holds is a value someone has to copy, so its ink does not change and its handle stays. A handle on a control nobody can type in is a handle that lies.',
          `<textarea slTextarea readonly [rows]="2">Read-only: the value stays selectable.</textarea>
           <textarea slTextarea disabled [rows]="2">Disabled</textarea>`,
        ),
    ),
  }),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A count bound to the value',
        'The control counts and the field draws it in the spare column of the label row, so a count that appears on the first keystroke never shares a row with the error and pushes it down.',
        `<div slField>
           <label slFieldLabel>Notes</label>
           <textarea slTextarea showCount maxlength="280" autoSize [rows]="2">Pick up at dock 3, from 8 AM to 11 AM.</textarea>
           <span slFieldDescription>Sent along with the invoice.</span>
         </div>`,
      ) +
        scene(
          'A limit the browser does not enforce',
          'countMax without maxlength is a soft limit: the value may pass it, and the counter turns red before validation has run — which is the only moment the count is being read.',
          `<div slField>
             <label slFieldLabel>Summary</label>
             <textarea slTextarea showCount countMax="40" [rows]="2">This summary is already past the requested limit.</textarea>
           </div>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { jwt: JWT },
    template: grid(
      2,
      scene(
        'A token with no break in it',
        'A signed URL, a certificate or a container digest wraps inside the control instead of taking the page’s horizontal scrollbar with it, and the whole string stays in the value.',
        `<textarea slTextarea [rows]="3">{{ jwt }}</textarea>
         <textarea slTextarea [rows]="3" placeholder="Describe what happened in as much detail as possible"></textarea>`,
      ) +
        scene(
          'At 240 pixels, and in the other direction',
          'The control never refuses to shrink, so a comment box in a drawer as narrow as a phone reflows rather than overflowing, and the mirrored layout is the same component.',
          measure(`<textarea slTextarea [rows]="3">A note written in a narrow drawer.</textarea>`) +
            measure(
              `<textarea slTextarea dir="rtl" [rows]="3">مرحبا بالعالم. هذا نص طويل بما يكفي لينتقل إلى السطر التالي.</textarea>`,
            ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { notes: new FormControl('Retirar na doca 3.') },
    template: grid(
      2,
      scene(
        'A control that belongs in a reactive form',
        'ControlValueAccessor is the two-way binding the ecosystem expects, and it is why there is no [(value)]: a two-way binding has one slot and can carry neither a reason nor cancel().',
        `<textarea slTextarea [formControl]="notes" autoSize [rows]="2"></textarea>`,
      ) +
        scene(
          'Reaching the instance, and the element under it',
          'exportAs hands the template the directive, and textareaElement is the native element — which already has focus, select and setSelectionRange, so no handle is invented for them.',
          `<textarea slTextarea #field="slTextarea" [rows]="2">Select all</textarea>
           <button type="button" (click)="field.textareaElement.select()">Select</button>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Enter makes a line, and nothing else is bound',
        'Press Enter inside the control: it adds a line and the form stays where it is. Press Tab: focus leaves rather than inserting a tab, so nobody is held inside a comment box by a shortcut the family invented.',
        `<div slField>
           <label slFieldLabel>Comment</label>
           <textarea slTextarea autoSize [rows]="2" [maxRows]="6"></textarea>
           <span slFieldDescription>Enter adds a line; the button submits.</span>
         </div>`,
      ),
    ),
  }),
};
