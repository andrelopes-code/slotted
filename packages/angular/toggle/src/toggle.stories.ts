import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBold,
  lucideItalic,
  lucidePin,
  lucideUnderline,
  lucideWrapText,
} from '@ng-icons/lucide';
import { Component, signal } from '@angular/core';
import { SlToggleButton } from '@slotted/angular/button';
import { SlTextField } from '@slotted/angular/text-field';
import { SlToolbar, SlToolbarSeparator } from '@slotted/angular/toolbar';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { ChangeRequest } from '@slotted/core/state';

import { SlToggle, SlToggleIcon } from './toggle';
import { provideToggleDefaults } from './toggle-defaults';
import type { ToggleSize, ToggleVariant } from './toggle-defaults';
import { ANGULAR_TOGGLE_DOCS, ANGULAR_TOGGLE_TOKENS } from './toggle.docs';

interface ToggleStoryArgs {
  defaultPressed: boolean;
  disabled: boolean;
  size: ToggleSize;
  variant: ToggleVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TOGGLE_DOCS.toggle.scenes, {
    playground: Playground,
    pressed: Pressed,
    variant: Variant,
    sizes: Sizes,
    iconOnly: IconOnly,
    states: States,
    toolbar: InsideAToolbar,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
    versus: Versus,
  }) as never;

/** The controlled toggle: the page holds the value and answers at once. */
@Component({
  selector: 'toggle-controlled-demo',
  standalone: true,
  imports: [NgIcon, SlText, SlToggle, SlToggleIcon],
  template: `
    <div class="slotted-demo-stack">
      <button slToggle [pressed]="wrap()" (pressedChange)="wrap.set($event.value)">
        <ng-icon slToggleIcon name="lucideWrapText" />
        Quebrar linhas
      </button>
      <p slText tone="muted">
        {{ wrap() ? 'The page keeps: on' : 'The page keeps: off' }}
      </p>
    </div>
  `,
})
class ControlledDemo {
  readonly wrap = signal(false);
}

/** Reads the reason a request carried. */
@Component({
  selector: 'toggle-reason-demo',
  standalone: true,
  imports: [NgIcon, SlText, SlToggle, SlToggleIcon],
  template: `
    <div class="slotted-demo-stack">
      <button slToggle (pressedChange)="seen.set($event.reason)">
        <ng-icon slToggleIcon name="lucideWrapText" />
        Wrap lines
      </button>
      <p slText tone="muted">Last reason: {{ seen() }}</p>
    </div>
  `,
})
class ReasonDemo {
  readonly seen = signal('none yet');
}

/** The other member: an action that persists, and waits. */
@Component({
  selector: 'toggle-follow-demo',
  standalone: true,
  imports: [SlToggleButton],
  template: `
    <button
      slToggleButton
      [loading]="following()"
      [pressed]="followed()"
      (pressedChange)="follow($event)"
    >
      Seguir
    </button>
  `,
})
class FollowDemo {
  readonly followed = signal(false);
  readonly following = signal(false);

  follow(request: ChangeRequest<boolean>) {
    this.following.set(true);
    setTimeout(() => {
      this.followed.set(request.value);
      this.following.set(false);
    }, 900);
  }
}

const DIRECTIVES = [
  ControlledDemo,
  FollowDemo,
  NgIcon,
  ReasonDemo,
  SlText,
  SlTextField,
  SlToggle,
  SlToggleIcon,
  SlToolbar,
  SlToolbarSeparator,
];

const meta: Meta<ToggleStoryArgs> = {
  title: 'Components/Toggle',
  component: SlToggle,
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({ lucideBold, lucideItalic, lucidePin, lucideUnderline, lucideWrapText }),
      ],
    }),
    moduleMetadata({ imports: DIRECTIVES }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toggle',
        description:
          'A two-state button standing on its own: a mode — Bold, Wrap, Pin — that is true the moment it is pressed, neutral until it is on and one color when it is. It is the APG Button pattern’s toggle button; the action that persists and waits is button’s SlToggleButton.',
        framework: 'Angular',
        ...ANGULAR_TOGGLE_DOCS.toggle,
        tokens: ANGULAR_TOGGLE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ToggleStoryArgs>;

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

const wrap = (attributes = '', label = 'Wrap lines') =>
  `<button slToggle ${attributes}><ng-icon slToggleIcon name="lucideWrapText" />${label}</button>`;
const pin = (attributes = '', label = 'Pin header') =>
  `<button slToggle ${attributes}><ng-icon slToggleIcon name="lucidePin" />${label}</button>`;
const mark = (name: string, label: string, attributes = '') =>
  `<button slToggle aria-label="${label}" ${attributes}><ng-icon slToggleIcon name="${name}" /></button>`;

export const Playground: Story = {
  args: {
    defaultPressed: true,
    disabled: false,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="stack">
        <button
          slToggle
          [defaultPressed]="defaultPressed"
          [disabled]="disabled"
          [size]="size"
          [variant]="variant"
        >
          <ng-icon slToggleIcon name="lucideWrapText" />
          Quebrar linhas
        </button>
      </div>`,
  }),
};

export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Uncontrolled',
        'The toggle owns its state and starts from defaultPressed. Press it and it moves on its own, emitting the request after the fact for anyone listening.',
        wrap('defaultPressed'),
      ) +
        scene(
          'Controlled',
          'The page holds the value in a signal. The toggle asks with a request carrying the reason, and shows nothing until the page has answered — which here it does at once.',
          `<toggle-controlled-demo />`,
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
        'outline',
        'An edge of its own, in the control border color, so the toggle stands beside a field as a control. On, the edge turns accent and the ground tints inside it.',
        pin() + pin('defaultPressed'),
        'row',
      ) +
        scene(
          'ghost',
          'No edge until it is on: the toggle for a bar or a card header that is already framed. Hover gives it the neutral ground; on gives it the same accent pair as outline.',
          pin('variant="ghost"') + pin('variant="ghost" defaultPressed'),
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
        'Each step reads the control scale, so the toggle is exactly as tall as the field next to it and the pair stays level at every density. Switch the density in the toolbar and both move together.',
        wrap('size="sm" defaultPressed', 'Quebrar') +
          measure(
            `<input slTextField aria-label="Buscar nos registros" placeholder="Buscar nos registros" />`,
          ) +
          wrap('defaultPressed', 'Quebrar') +
          wrap('size="lg"', 'Quebrar'),
        'row',
      ),
    ),
  }),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Square, named by aria-label',
        'With no words the toggle is as wide as it is tall and the mark is centerd. The name a reader hears is the aria-label the consumer wrote, and it does not change when the state does.',
        mark('lucideBold', 'Bold', 'defaultPressed') +
          mark('lucideItalic', 'Italic') +
          mark('lucideUnderline', 'Underline'),
        'row',
      ) +
        scene(
          'The same marks, ghost',
          'A bare icon toggle is the one most toolbars hold. Off, only the mark is drawn; on, the accent pair frames it — so the state is never carried by the mark alone.',
          mark('lucideBold', 'Bold', 'variant="ghost" defaultPressed') +
            mark('lucideItalic', 'Italic', 'variant="ghost"') +
            mark('lucideUnderline', 'Underline', 'variant="ghost"'),
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
        'Off, on, and both unavailable — outline',
        'Hover the first two: off takes the neutral ground, on takes the accent ground’s own hover step, and the two never share a surface. The disabled pair keeps the accent edge on the one that is on.',
        pin() + pin('defaultPressed') + pin('disabled') + pin('defaultPressed disabled'),
        'row',
      ) +
        scene(
          'The same four, ghost',
          'A ghost toggle that is on has taken a fill and an edge, so it is a framed thing; unavailable and on, it keeps the edge and takes the disabled ground, which in high contrast is the page’s own white.',
          pin('variant="ghost"') +
            pin('variant="ghost" defaultPressed') +
            pin('variant="ghost" disabled') +
            pin('variant="ghost" defaultPressed disabled'),
          'row',
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
        'An editor bar',
        'Tab reaches the bar once and lands on one control; the arrows move across every control in it, toggles included; Space presses the one under focus. The bar found each toggle as it finds every focusable control it holds.',
        `<div slToolbar aria-label="Editor">
          ${mark('lucideBold', 'Bold', 'variant="ghost" defaultPressed')}
          ${mark('lucideItalic', 'Italic', 'variant="ghost"')}
          ${mark('lucideUnderline', 'Underline', 'variant="ghost"')}
          <hr slToolbarSeparator />
          ${wrap('variant="ghost"', 'Quebrar')}
          ${pin('variant="ghost" defaultPressed', 'Fixar')}
        </div>`,
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
        'A long translated label in a narrow column',
        'The words clamp at the ellipsis rather than wrapping the control onto a second line, and the string stays whole in the DOM, so the accessible name is the full label.',
        measure(wrap('defaultPressed', 'Zeilenumbruch aktivieren')),
        'block',
      ) +
        scene(
          'Reading direction',
          'Switch the direction in the toolbar: the mark moves to the other side of the words, because the gap between them is logical and the family names no left or right.',
          wrap('defaultPressed') + pin(),
          'row',
        ),
    ),
  }),
};

export const Composition: Story = {
  decorators: [
    applicationConfig({ providers: [provideToggleDefaults({ size: 'sm', variant: 'ghost' })] }),
  ],
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Defaults provided once',
        'provideToggleDefaults() hands size and variant to every toggle under the injector. The last one states its own size and wins, because an explicit input is never overridden by the token.',
        mark('lucideBold', 'Bold', 'defaultPressed') +
          mark('lucideItalic', 'Italic') +
          pin('size="md"', 'Pin'),
        'row',
      ) +
        scene(
          'The consumer’s own element, and the instance',
          'The directive sits on the button the consumer wrote — here one carrying an analytics attribute — and exportAs reaches the instance, so the template reads isPressed() without owning a second copy of the state.',
          `<button slToggle #pin="slToggle" data-track="pin-header">
            <ng-icon slToggleIcon name="lucidePin" />
            Pin header
          </button>
          <p slText tone="muted">{{ pin.isPressed() ? 'Pinned' : 'Unpinned' }}</p>`,
          'row',
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
        'Space, Enter, and the reason they carry',
        'Tab to the toggle and press Space or Enter: it turns on, and the request says keyboard. Click it and the request says pointer. No other key is bound — a single button has no arrows of its own.',
        `<toggle-reason-demo />`,
      ),
    ),
  }),
};

export const Versus: Story = {
  parameters: scenario('versus'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Toggle: a mode',
        'True the moment it is pressed, neutral until on, one color when on. Wrap, Pin, Bold: nothing is sent anywhere, and the reader sees the effect at once.',
        wrap() + pin('defaultPressed'),
        'row',
      ) +
        scene(
          'SlToggleButton: an action that persists',
          'Follow reaches a server before it is true, so button’s SlToggleButton waits with its indicator and holds the state it still has. It stands in a tone, beside the page’s other actions. Same state model, different member.',
          `<toggle-follow-demo />`,
          'row',
        ),
    ),
  }),
};
