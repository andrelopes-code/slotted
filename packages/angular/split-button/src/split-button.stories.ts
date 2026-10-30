import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSave } from '@ng-icons/lucide';
import { Component, signal } from '@angular/core';
import { SlButton, SlButtonStart } from '@slotted/angular/button';
import type { ButtonSize, ButtonTone, ButtonVariant } from '@slotted/angular/button';
import { SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuSeparator } from '@slotted/angular/menu';
import { SlTextField } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { ChangeRequest } from '@slotted/core/state';

import { SlSplitButton } from './split-button';
import { provideSplitButtonDefaults } from './split-button-defaults';
import {
  SlSplitButtonChoices,
  SlSplitButtonMenuTrigger,
  SlSplitButtonPrimary,
} from './split-button-parts';
import { ANGULAR_SPLIT_BUTTON_DOCS, ANGULAR_SPLIT_BUTTON_TOKENS } from './split-button.docs';

interface SplitButtonStoryArgs {
  disabled: boolean;
  fullWidth: boolean;
  loading: boolean;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SPLIT_BUTTON_DOCS.splitButton.scenes, {
    playground: Playground,
    variants: Variants,
    sizes: Sizes,
    remember: Remember,
    loading: Loading,
    states: States,
    width: Width,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const STRATEGIES: Record<string, string> = {
  merge: 'Criar um commit de merge',
  squash: 'Squash e merge',
  rebase: 'Rebase e merge',
};

/** The merge button whose strategy a repository remembers. */
@Component({
  selector: 'split-button-merge-demo',
  standalone: true,
  imports: [
    SlMenu,
    SlMenuItem,
    SlMenuRadioGroup,
    SlSplitButton,
    SlSplitButtonChoices,
    SlSplitButtonMenuTrigger,
    SlSplitButtonPrimary,
    SlText,
  ],
  template: `
    <div class="slotted-demo-stack">
      <div slSplitButton remember [value]="strategy()" (valueChange)="strategy.set($event.value)">
        <button slSplitButtonPrimary (click)="last.set(labels[strategy()] ?? strategy())">
          {{ labels[strategy()] }}
        </button>
        <button
          slSplitButtonMenuTrigger
          [slMenuTriggerFor]="more"
          aria-label="More merge strategies"
        ></button>
        <sl-menu #more>
          <sl-menu-radio-group slSplitButtonChoices>
            <button slMenuRadioItem value="merge">Criar um commit de merge</button>
            <button slMenuRadioItem value="squash">Squash e merge</button>
            <button slMenuRadioItem value="rebase">Rebase e merge</button>
          </sl-menu-radio-group>
        </sl-menu>
      </div>
      <p slText tone="muted">Last action run: {{ last() }}</p>
    </div>
  `,
})
class MergeDemo {
  readonly labels = STRATEGIES;
  readonly strategy = signal('squash');
  readonly last = signal('none');
}

/** Press Save and the whole control is busy for a moment. */
@Component({
  selector: 'split-button-saving-demo',
  standalone: true,
  imports: [SlMenu, SlMenuItem, SlSplitButton, SlSplitButtonMenuTrigger, SlSplitButtonPrimary],
  template: `
    <div slSplitButton [loading]="saving()">
      <button slSplitButtonPrimary (click)="save()">Save</button>
      <button
        slSplitButtonMenuTrigger
        [slMenuTriggerFor]="more"
        aria-label="More save options"
      ></button>
      <sl-menu #more>
        <button slMenuItem>Save as draft</button>
        <button slMenuItem>Save and close</button>
      </sl-menu>
    </div>
  `,
})
class SavingDemo {
  readonly saving = signal(false);

  save() {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1600);
  }
}

/** Reads why the menu opened, and that the action ran. */
@Component({
  selector: 'split-button-reason-demo',
  standalone: true,
  imports: [
    SlMenu,
    SlMenuItem,
    SlSplitButton,
    SlSplitButtonMenuTrigger,
    SlSplitButtonPrimary,
    SlText,
  ],
  template: `
    <div class="slotted-demo-stack">
      <div slSplitButton>
        <button slSplitButtonPrimary (click)="seen.set('the action ran')">Save</button>
        <button
          slSplitButtonMenuTrigger
          [slMenuTriggerFor]="more"
          aria-label="More save options"
        ></button>
        <sl-menu #more (openChangeRequest)="record($event)">
          <button slMenuItem>Save as draft</button>
          <button slMenuItem>Save and close</button>
        </sl-menu>
      </div>
      <p slText tone="muted">Last event: {{ seen() }}</p>
    </div>
  `,
})
class ReasonDemo {
  readonly seen = signal('none yet');

  record(request: ChangeRequest<boolean>) {
    this.seen.set(`${request.value ? 'abriu' : 'fechou'}: ${request.reason}`);
  }
}

const DIRECTIVES = [
  MergeDemo,
  NgIcon,
  ReasonDemo,
  SavingDemo,
  SlButton,
  SlButtonStart,
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlSplitButton,
  SlSplitButtonChoices,
  SlSplitButtonMenuTrigger,
  SlSplitButtonPrimary,
  SlText,
  SlTextField,
];

const meta: Meta<SplitButtonStoryArgs> = {
  title: 'Components/SplitButton',
  component: SlSplitButton,
  decorators: [
    applicationConfig({ providers: [provideIcons({ lucideSave })] }),
    moduleMetadata({ imports: DIRECTIVES }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Split Button',
        description:
          'An action and the menu of its alternatives, joined into one shape. Two of button’s controls over menu, each with its own tab stop; the choice in the menu becomes the action only under remember, because a silent update changes what the next click does.',
        framework: 'Angular',
        ...ANGULAR_SPLIT_BUTTON_DOCS.splitButton,
        tokens: ANGULAR_SPLIT_BUTTON_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SplitButtonStoryArgs>;

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

let counter = 0;

/** The save button most of the page is about: one action, two alternatives. */
function save({
  attributes = '',
  label = 'Save',
  menuLabel = 'More save options',
  primary = '',
  start = '',
  trigger = '',
}: {
  attributes?: string;
  label?: string;
  menuLabel?: string;
  primary?: string;
  start?: string;
  trigger?: string;
} = {}) {
  counter += 1;
  const ref = `more${counter}`;
  return `<div slSplitButton ${attributes}>
    <button slSplitButtonPrimary ${primary}>${start}${label}</button>
    <button slSplitButtonMenuTrigger [slMenuTriggerFor]="${ref}" aria-label="${menuLabel}" ${trigger}></button>
    <sl-menu #${ref}>
      <button slMenuItem>Save as draft</button>
      <button slMenuItem>Save and close</button>
      <hr slMenuSeparator />
      <button slMenuItem>Save as template…</button>
    </sl-menu>
  </div>`;
}

export const Playground: Story = {
  args: {
    disabled: false,
    fullWidth: false,
    loading: false,
    size: 'md',
    tone: 'accent',
    variant: 'solid',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="stack">
        ${save({
          attributes:
            '[tone]="tone" [variant]="variant" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth"',
        })}
      </div>`,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: grid(
      1,
      scene(
        'solid, every tone',
        'Two filled halves are one rectangle until the seam divides them: the tone’s darkest step on the trigger’s leading edge, which is what Primer, Material and Ant reach for. Hover either half and only its fill moves.',
        save() +
          save({
            attributes: 'tone="secondary"',
            label: 'Export',
            menuLabel: 'More export options',
          }) +
          save({
            attributes: 'tone="success"',
            label: 'Approve',
            menuLabel: 'More approval options',
          }) +
          save({
            attributes: 'tone="warning"',
            label: 'Suspend',
            menuLabel: 'More suspension options',
          }) +
          save({
            attributes: 'tone="danger"',
            label: 'Delete',
            menuLabel: 'More delete options',
          }),
        'row',
      ) +
        scene(
          'outline and ghost',
          'An outlined pair shares the neutral edge, one line in the shared column; a ghost pair has no edge at all and the trigger reads as part of the action by proximity alone. Both keep the two corners on the ends and none between.',
          save({ attributes: 'variant="outline"' }) +
            save({
              attributes: 'tone="secondary" variant="outline"',
              label: 'Export',
              menuLabel: 'More export options',
            }) +
            save({ attributes: 'variant="ghost"' }) +
            save({
              attributes: 'tone="secondary" variant="ghost"',
              label: 'Export',
              menuLabel: 'More export options',
            }),
          'row',
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
        'sm, md and lg beside a field of the same step',
        'The bar is as tall as the field next to it at every step, and the trigger is square from the same height. Switch the density in the toolbar: both move together, and the trigger never shrinks below its own target.',
        save({ attributes: 'size="sm"' }) +
          measure(`<input slTextField aria-label="Invoice title" placeholder="Invoice title" />`) +
          save({ attributes: 'variant="outline"' }) +
          save({ attributes: 'size="lg"' }),
        'row',
      ),
    ),
  }),
};

export const Remember: Story = {
  parameters: scenario('remember'),
  render: () => ({
    template: grid(
      2,
      scene(
        'remember: the merge button',
        'The alternatives are radio items bound to the family’s value; the page holds it in a signal and renders the action from it. Choose Rebase, then press the action: what ran is what the label said, and the menu shows it checked.',
        `<split-button-merge-demo />`,
      ) +
        scene(
          'Without remember: alternatives are actions',
          'The same shape with plain items. Choosing one runs it and changes nothing about the action, which is the default because a silent update would change what the next click does.',
          save(),
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Press Save',
        'For a second and a half the primary shows its indicator with the width held, and the trigger waits with it: painted in the tone, focusable, aria-disabled, refusing the click and the arrows. Tab to it meanwhile and hear why.',
        `<split-button-saving-demo />`,
      ) +
        scene(
          'The same, held',
          'loading on the root, in solid and in outline, photographed at rest so the two halves can be compared: one control that is busy, not one half working beside one half broken.',
          save({ attributes: 'loading' }) +
            save({
              attributes: 'loading tone="secondary" variant="outline"',
              label: 'Export',
              menuLabel: 'More export options',
            }),
          'row',
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
        'disabled on the root',
        'Both halves take the native attribute and button’s disabled paint; between two solid halves the seam takes the disabled border, so the bar reads as one unavailable control rather than a grey one with a colored line through it.',
        save({ attributes: 'disabled' }) +
          save({ attributes: 'disabled variant="outline"' }) +
          save({ attributes: 'disabled variant="ghost"' }),
        'row',
      ) +
        scene(
          'One half out',
          'disabled on the primary alone leaves the menu an action — a request that cannot be merged still has Close without merging — and disabled on the trigger alone leaves the action.',
          `<div slSplitButton>
            <button slSplitButtonPrimary disabled>Merge</button>
            <button slSplitButtonMenuTrigger [slMenuTriggerFor]="merge" aria-label="More merge options"></button>
            <sl-menu #merge>
              <button slMenuItem>Close without merging</button>
            </sl-menu>
          </div>` +
            save({
              attributes: 'tone="secondary" variant="outline"',
              label: 'Export',
              menuLabel: 'More export options',
              trigger: 'disabled',
            }),
          'row',
        ),
    ),
  }),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => ({
    template: grid(
      2,
      scene(
        'fullWidth',
        'The action takes the whole line and the trigger stays square at the end of it — the shape an action row on a phone needs, with the menu still one tap wide.',
        `<div slSplitButton fullWidth>
          <button slSplitButtonPrimary>Place order</button>
          <button slSplitButtonMenuTrigger [slMenuTriggerFor]="order" aria-label="More order options"></button>
          <sl-menu #order>
            <button slMenuItem>Schedule delivery</button>
            <button slMenuItem>Save for later</button>
          </sl-menu>
        </div>`,
        'block',
      ) +
        scene(
          'A narrow room',
          'In a column narrower than its words the action wraps inside its own control and the trigger keeps its square, so the bar never pushes past the container the page gave it.',
          measure(
            save({
              attributes: 'variant="outline"',
              label: 'Speichern und Benachrichtigung senden',
              menuLabel: 'Weitere Speicheroptionen',
            }),
          ),
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
        'SlButton’s own slots on the action',
        'slButtonStart is SlButton’s start slot and reaches the primary unchanged, mark aligned to the label’s text. Nothing of SlButton was re-declared to get it there.',
        save({ start: '<ng-icon slButtonStart name="lucideSave" />' }),
        'row',
      ) +
        scene(
          'Reading direction',
          'Switch the direction in the toolbar: the trigger moves to the other end of the action, the corners follow, and the chevron stays a chevron-down — nothing in the family names left or right.',
          save() +
            save({
              attributes: 'tone="secondary" variant="outline"',
              label: 'Export',
              menuLabel: 'More export options',
            }),
          'row',
        ),
    ),
  }),
};

export const Composition: Story = {
  decorators: [
    applicationConfig({
      providers: [provideSplitButtonDefaults({ size: 'sm', variant: 'outline' })],
    }),
  ],
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Defaults provided, the consumer’s elements, and the menu instance',
        'provideSplitButtonDefaults() paints the split button small and outlined; the root is a section and the action carries an analytics attribute, part names kept; the second button opens the menu through sl-menu’s own instance, carrying the programmatic reason.',
        `<div class="slotted-demo-row">
          <section slSplitButton>
            <button slSplitButtonPrimary data-track="save">Save</button>
            <button slSplitButtonMenuTrigger [slMenuTriggerFor]="handle" aria-label="More save options"></button>
            <sl-menu #handle="slMenu">
              <button slMenuItem>Save as draft</button>
              <button slMenuItem>Save and close</button>
            </sl-menu>
          </section>
          <button slButton size="sm" tone="secondary" variant="ghost" (click)="handle.toggle(true, 'programmatic')">
            Open through the instance
          </button>
        </div>`,
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
        'Two stops, and the menu button’s keys',
        'Tab reaches Save, then the trigger. On the trigger Space and Enter open on the first item, ArrowDown on the first, ArrowUp on the last; Escape closes and comes back. On Save the arrows do nothing, and the line below says what the family saw.',
        `<split-button-reason-demo />`,
      ),
    ),
  }),
};
