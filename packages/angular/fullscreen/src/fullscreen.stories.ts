import { Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePresentation, lucideX } from '@ng-icons/lucide';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlChart } from '@slotted/angular/chart';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import {
  SlFullscreen,
  SlFullscreenContent,
  SlFullscreenIcon,
  SlFullscreenTrigger,
} from './fullscreen';
import { provideFullscreenDefaults } from './fullscreen-defaults';
import { ANGULAR_FULLSCREEN_DOCS, ANGULAR_FULLSCREEN_TOKENS } from './fullscreen.docs';

interface FullscreenStoryArgs {
  mode: 'auto' | 'layout';
  navigationUI: 'auto' | 'show' | 'hide';
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_FULLSCREEN_DOCS.fullscreen.scenes, {
    playground: Playground,
    layout: Layout,
    fill: Fill,
    controlled: Controlled,
    error: ErrorState,
    overlays: Overlays,
    document: DocumentRegion,
    keyboard: Keyboard,
    trigger: Trigger,
    iconOnly: IconOnly,
    outside: Outside,
    composition: Composition,
  }) as never;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const REVENUE = [412, 468, 431, 522, 497, 588, 604, 571, 633, 689, 702, 758];
const brlThousands = (value: number, locale: string | undefined) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value * 1000);

/** Every value the chart binds, named once so the templates read as a consumer would write them. */
const CHART = {
  monthly: MONTHS.map((month, index) => ({ month, revenue: REVENUE[index] })),
  series: [{ kind: 'bar', field: 'revenue', label: 'Revenue' }] as const,
  month: { field: 'month', label: 'Month' } as const,
  brl: { format: brlThousands },
};

/**
 * The consumer's panel: a chart in the content part, the region's control in
 * the chart's own actions. In full screen the content part takes the height,
 * and the chart's plot takes what its header leaves.
 */
const panel = (
  control = '<button slFullscreenTrigger iconOnly></button>',
  extra = '',
  description = 'Milhares de reais, 2026',
) => `
  <div slFullscreenContent>
    <figure slChart title="Revenue by month" description="${description}" variant="card" toolbar="none"
      [data]="monthly" [series]="series" [x]="month" [y]="brl">
      <div slChartActions class="slotted-demo-row">${extra}${control}</div>
    </figure>
  </div>`;

/* Components compile their template ahead of time, so they read constants
   rather than the function the story templates call. Each demo prints its
   status in the chart's description, which stays in view in full screen. */
const OPEN = `
  <div slFullscreenContent>
    <figure slChart title="Revenue by month" variant="card" toolbar="none"
      [data]="monthly" [series]="series" [x]="month" [y]="brl" [description]="status()">
      <div slChartActions class="slotted-demo-row">`;
const CLOSE = `
      </div>
    </figure>
  </div>`;
const PANEL_ICON = `${OPEN}<button slFullscreenTrigger iconOnly></button>${CLOSE}`;
const PANEL_OUTLINE = `${OPEN}<button slFullscreenTrigger variant="outline"></button>${CLOSE}`;

const DEMO_IMPORTS = [SlChart, SlFullscreen, SlFullscreenContent, SlFullscreenTrigger];

/** The page holds the state, and prints each request's reason. */
@Component({
  selector: 'fullscreen-controlled-demo',
  standalone: true,
  imports: DEMO_IMPORTS,
  template: `
    <section
      slFullscreen
      [(fullscreen)]="presenting"
      (fullscreenChangeRequest)="
        log.set([($event.value ? 'enter' : 'exit') + ' · ' + $event.reason].concat(log()))
      "
    >
      ${PANEL_ICON}
    </section>
  `,
})
class ControlledDemo {
  readonly presenting = signal(false);
  readonly log = signal<string[]>([]);
  readonly status = computed(() =>
    this.log().length === 0 ? 'No requests yet.' : this.log().slice(0, 4).join(' — '),
  );
  readonly monthly = CHART.monthly;
  readonly series = CHART.series;
  readonly month = CHART.month;
  readonly brl = CHART.brl;
}

/** Prints the last refusal. */
@Component({
  selector: 'fullscreen-error-demo',
  standalone: true,
  imports: DEMO_IMPORTS,
  template: `
    <section slFullscreen (fullscreenError)="kind.set($event.kind)">${PANEL_ICON}</section>
  `,
})
class ErrorDemo {
  readonly kind = signal<string | null>(null);
  readonly status = computed(() => {
    const kind = this.kind();
    return kind === null
      ? 'The browser has not refused anything yet.'
      : `Last error: ${kind} — the region entered the layout.`;
  });
  readonly monthly = CHART.monthly;
  readonly series = CHART.series;
  readonly month = CHART.month;
  readonly brl = CHART.brl;
}

/** Prints the reason of the last request. */
@Component({
  selector: 'fullscreen-keyboard-demo',
  standalone: true,
  imports: DEMO_IMPORTS,
  template: `
    <section slFullscreen mode="layout" (fullscreenChangeRequest)="reason.set($event.reason)">
      ${PANEL_OUTLINE}
    </section>
  `,
})
class KeyboardDemo {
  readonly reason = signal('—');
  readonly status = computed(() => `Last reason: ${this.reason()}`);
  readonly monthly = CHART.monthly;
  readonly series = CHART.series;
  readonly month = CHART.month;
  readonly brl = CHART.brl;
}

const DIRECTIVES = [
  ControlledDemo,
  ErrorDemo,
  KeyboardDemo,
  NgIcon,
  SlCard,
  SlCardBody,
  SlCardHeader,
  SlChart,
  SlFullscreen,
  SlFullscreenContent,
  SlFullscreenIcon,
  SlFullscreenTrigger,
  SlHeading,
  SlSelect,
  SlSelectItem,
  SlText,
];

const meta: Meta<FullscreenStoryArgs> = {
  title: 'Components/Fullscreen',
  component: SlFullscreen,
  decorators: [
    applicationConfig({ providers: [provideIcons({ lucidePresentation, lucideX })] }),
    moduleMetadata({ imports: DIRECTIVES }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Fullscreen',
        description:
          'A region the reader can give the whole screen — by the Fullscreen API where the page may ask, fixed over the page where it may not — and the control whose words and mark follow the state. Escape in native full screen stays the browser’s.',
        framework: 'Angular',
        ...ANGULAR_FULLSCREEN_DOCS.fullscreen,
        tokens: ANGULAR_FULLSCREEN_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FullscreenStoryArgs>;

const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'block',
  floor?: number,
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}"${floor === undefined ? '' : ` data-collapse-floor="${String(floor)}"`}>${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

export const Playground: Story = {
  args: { mode: 'auto', navigationUI: 'auto' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...CHART },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <section slFullscreen [mode]="mode" [navigationUI]="navigationUI">${panel()}</section>
      </div>`,
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    props: CHART,
    template: scene(
      'mode=layout',
      'Press the control: the panel is fixed over this page, the page stops scrolling, and Escape or the control gives it back.',
      `<section slFullscreen mode="layout">${panel('<button slFullscreenTrigger variant="outline"></button>')}</section>`,
    ),
  }),
};

export const Fill: Story = {
  parameters: scenario('fill'),
  render: () => ({
    props: CHART,
    template: grid(
      2,
      scene(
        'slFullscreenContent between a bar and a caption',
        'In full screen the bar and the caption keep their height and the content part takes the rest; the chart’s plot grows into it.',
        `<section slFullscreen mode="layout">
          <div class="slotted-demo-row">
            <p slText size="sm" tone="muted">Finance dashboard · updated at 09:40</p>
            <button slFullscreenTrigger variant="outline"></button>
          </div>
          <div slFullscreenContent>
            <figure slChart title="Revenue by month" toolbar="none"
              [data]="monthly" [series]="series" [x]="month" [y]="brl"></figure>
          </div>
          <p slText size="sm" tone="muted">Source: accounting close of each month.</p>
        </section>`,
      ) +
        scene(
          'A lone card',
          'With one child and no content part, the child is given the height: the card’s frame reaches the bottom of the screen.',
          `<section slFullscreen mode="layout">
            <article slCard>
              <header slCardHeader>
                <div class="slotted-demo-row">
                  <h3 slHeading size="lg">Open orders</h3>
                  <button slFullscreenTrigger iconOnly></button>
                </div>
              </header>
              <div slCardBody>
                <p slText>1,510 orders, 12% above last week.</p>
              </div>
            </article>
          </section>`,
        ),
    ),
  }),
};

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => ({
    template: scene(
      '[(fullscreen)] + fullscreenChangeRequest',
      'The page holds the value; the chart’s description prints the reason of every request, escape included.',
      `<fullscreen-controlled-demo />`,
    ),
  }),
};

export const ErrorState: Story = {
  name: 'Error',
  parameters: scenario('error'),
  render: () => ({
    template: scene(
      'fullscreenError',
      'Inside Storybook’s preview frame the browser may refuse; the chart’s description prints the kind, and the panel is full screen in the layout either way.',
      `<fullscreen-error-demo />`,
    ),
  }),
};

export const Overlays: Story = {
  parameters: scenario('overlays'),
  render: () => ({
    props: CHART,
    template: scene(
      'sl-select inside the region',
      'Enter full screen, then open the period: the list opens inside the region, above the chart.',
      `<section slFullscreen>${panel(
        undefined,
        `<sl-select aria-label="Period" [value]="'6m'">
          <sl-select-item value="3m">Last 3 months</sl-select-item>
          <sl-select-item value="6m">Last 6 months</sl-select-item>
          <sl-select-item value="12m">Last 12 months</sl-select-item>
        </sl-select>`,
      )}</section>`,
    ),
  }),
};

export const DocumentRegion: Story = {
  name: 'Document',
  parameters: scenario('document'),
  render: () => ({
    template: scene(
      'The application root as the region',
      'The directive sits on the outermost element of this story and the control takes its instance: the whole story goes full screen.',
      `<div slFullscreen #app="slFullscreen" class="slotted-demo-stack">
        <div class="slotted-demo-row">
          <button [slFullscreenTrigger]="app" variant="outline">
            {{ app.fullscreen() ? 'Exit presentation mode' : 'Presentation mode' }}
          </button>
          <p slText size="sm" tone="muted">
            {{ app.supported() ? 'The API is available.' : 'No API: the story falls back to the layout.' }}
          </p>
        </div>
      </div>`,
      'stack',
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: scene(
      'Tab · Space · Enter · Escape',
      'Space prints keyboard; a click prints pointer; Escape in the layout prints escape. While full screen, Tab stays inside the panel.',
      `<fullscreen-keyboard-demo />`,
    ),
  }),
};

export const Trigger: Story = {
  parameters: scenario('trigger'),
  render: () => ({
    template: grid(
      2,
      scene(
        'ghost',
        'Bare until hovered, for a bar that is already framed.',
        `<button slFullscreenTrigger size="sm"></button><button slFullscreenTrigger></button><button slFullscreenTrigger size="lg"></button>`,
        'row',
      ) +
        scene(
          'outline',
          'Its own edge and ground, for a control over content.',
          `<button slFullscreenTrigger size="sm" variant="outline"></button><button slFullscreenTrigger variant="outline"></button><button slFullscreenTrigger size="lg" variant="outline"></button>`,
          'row',
        ) +
        scene(
          'In full screen',
          'The words and the mark say what the press does next. The region here starts in the layout; the control inside brings it back.',
          `<div slFullscreen #shown="slFullscreen" mode="layout"></div>
          <button [slFullscreenTrigger]="shown"></button>
          <button [slFullscreenTrigger]="shown" variant="outline"></button>`,
          'row',
        ) +
        scene(
          'disabled',
          'Legible, and the press is refused.',
          `<button slFullscreenTrigger disabled></button><button slFullscreenTrigger disabled variant="outline"></button>`,
          'row',
        ),
    ),
  }),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => ({
    template: scene(
      'iconOnly',
      'Square from the control height; the words stay as the accessible name in both states.',
      `<button slFullscreenTrigger iconOnly size="sm"></button>
      <button slFullscreenTrigger iconOnly></button>
      <button slFullscreenTrigger iconOnly size="lg"></button>
      <button slFullscreenTrigger iconOnly variant="outline"></button>`,
      'row',
      // A square control is as wide as it is tall, 30 to 38 pixels by step.
      24,
    ),
  }),
};

export const Outside: Story = {
  parameters: scenario('outside'),
  render: () => ({
    props: CHART,
    template: scene(
      'exportAs + [slFullscreenTrigger]',
      'The control in the bar drives the section below; the control inside the section takes the reader back.',
      `<div class="slotted-demo-row">
          <p slText size="sm" tone="muted">Sales dashboard</p>
          <button [slFullscreenTrigger]="chart" variant="outline"></button>
        </div>
        <section slFullscreen #chart="slFullscreen" mode="layout">${panel()}</section>`,
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideFullscreenDefaults({ size: 'sm' })],
    }),
  ],
  render: () => ({
    props: CHART,
    template: scene(
      'Provider, a label and a mark of the consumer',
      'The provider sets the step; the control says Apresentar and Terminar and changes its mark with the state.',
      `<div class="slotted-demo-measure">
        <section slFullscreen #fs="slFullscreen" mode="layout">${panel(
          `<button slFullscreenTrigger variant="outline">
            <ng-icon slFullscreenIcon [name]="fs.fullscreen() ? 'lucideX' : 'lucidePresentation'" />
            {{ fs.fullscreen() ? 'Terminar' : 'Apresentar' }}
          </button>`,
        )}</section>
      </div>`,
    ),
  }),
};
