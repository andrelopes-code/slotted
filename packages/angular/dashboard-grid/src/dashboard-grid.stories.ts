import { Component, computed, inject, Injector, input, signal, type OnInit } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlChart } from '@slotted/angular/chart';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlInline } from '@slotted/angular/inline';
import { SlSkeletonText } from '@slotted/angular/skeleton';
import { SlSparkline } from '@slotted/angular/sparkline';
import { SlStack } from '@slotted/angular/stack';
import {
  SlStatCard,
  SlStatCardDelta,
  SlStatCardFigure,
  SlStatCardTrend,
  SlStatCardValue,
} from '@slotted/angular/stat-card';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
import { SlText } from '@slotted/angular/typography';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDashboardGrid } from './dashboard-grid';
import {
  provideDashboardGridDefaults,
  type DashboardLayout,
  type DashboardLayoutRequest,
} from './dashboard-grid-defaults';
import {
  SlDashboardWidget,
  SlDashboardWidgetActions,
  SlDashboardWidgetEmptyAction,
  SlDashboardWidgetFooter,
  SlDashboardWidgetSkeleton,
} from './dashboard-widget';
import { ANGULAR_DASHBOARD_GRID_DOCS, ANGULAR_DASHBOARD_GRID_TOKENS } from './dashboard-grid.docs';
import { persistedDashboardLayout } from './persisted-dashboard-layout';

/* ── Trailhead, an outdoor retailer, one month of sales ─────────────────── */

const EURO: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
};
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };
const WEEKS = [42, 55, 48, 61, 58, 70, 66, 74, 69, 81, 77, 88];
const ORDERS = [310, 322, 298, 341, 356, 349, 372, 368, 381, 390, 402, 391];
const REFUNDS = [9, 11, 8, 14, 10, 12, 9, 13, 15, 11, 16, 18];
const CONVERSION = [3.1, 3.0, 3.2, 2.9, 3.0, 2.8, 2.9, 3.0, 2.7, 2.8, 2.9, 2.8];
const PRODUCTS = [
  { name: 'Trail runner 2', amount: '€61,204' },
  { name: 'Merino crew', amount: '€44,810' },
  { name: 'Rain shell', amount: '€39,377' },
  { name: 'Day pack 24 l', amount: '€28,960' },
  { name: 'Wool beanie', amount: '€12,118' },
  { name: 'Trail socks', amount: '€9,874' },
  { name: 'Head torch', amount: '€7,215' },
];

/** Which story the sales overview is drawn for: each changes only what it shows. */
type Mode =
  'default' | 'anatomy' | 'constraints' | 'states' | 'labels' | 'accessibility' | 'persistence';

/**
 * The sales overview over a layout and a mode this story owns, with the
 * page's own Edit layout button above it and the last request written under it.
 */
@Component({
  selector: 'sl-dashboard-sales-demo',
  standalone: true,
  imports: [
    SlButton,
    SlChart,
    SlDashboardGrid,
    SlDashboardWidget,
    SlDashboardWidgetActions,
    SlDashboardWidgetEmptyAction,
    SlDashboardWidgetFooter,
    SlDashboardWidgetSkeleton,
    SlInline,
    SlSkeletonText,
    SlSparkline,
    SlStack,
    SlStatCard,
    SlStatCardDelta,
    SlStatCardFigure,
    SlStatCardTrend,
    SlStatCardValue,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlText,
  ],
  template: `
    <div slStack [gap]="4">
      @if (controls()) {
        <div slInline [gap]="3">
          @if (mode() === 'accessibility' && editing()) {
            <button slButton size="sm" tone="accent" variant="solid" (click)="grid.commitEditing()">
              Done
            </button>
          } @else {
            <button
              slButton
              size="sm"
              tone="secondary"
              variant="outline"
              [disabled]="editing()"
              (click)="editing.set(true)"
            >
              Edit layout
            </button>
          }
          @if (mode() === 'persistence') {
            <button slButton size="sm" tone="danger" variant="ghost" (click)="persisted?.clear()">
              Forget layout
            </button>
          }
        </div>
      }
      <div
        slDashboardGrid
        #grid="slDashboardGrid"
        aria-label="Sales overview"
        [columns]="columns()"
        [editBar]="mode() === 'accessibility' ? false : editBar()"
        [headingLevel]="mode() === 'labels' ? 2 : undefined"
        [(editing)]="editing"
        [layout]="layout()"
        (layoutChange)="onLayout($event)"
        (layoutChangeRequest)="last.set($event)"
      >
        <sl-dashboard-widget
          value="revenue"
          defaultColumns="3"
          detailHref="#revenue"
          [title]="t('Revenue', 'Receita')"
          [movable]="mode() === 'constraints' ? false : undefined"
          [description]="mode() === 'constraints' ? 'Pinned by finance' : undefined"
          [loading]="mode() === 'states'"
        >
          <div slStatCard fill="plain" layout="stacked" size="sm" goodWhen="up" [delta]="0.124">
            <div slStatCardFigure>
              <span slStatCardValue [value]="482190" [formatOptions]="euro"></span>
              <span slStatCardDelta></span>
            </div>
            <div slStatCardTrend><span slSparkline area size="lg" [data]="weeks"></span></div>
          </div>
        </sl-dashboard-widget>
        <sl-dashboard-widget
          value="orders"
          defaultColumns="3"
          detailHref="#orders"
          [title]="t('Orders', 'Encomendas')"
          [busy]="mode() === 'states'"
        >
          <div slStatCard fill="plain" layout="stacked" size="sm" goodWhen="up" [delta]="0.031">
            <div slStatCardFigure>
              <span slStatCardValue [value]="3914"></span>
              <span slStatCardDelta></span>
            </div>
            <div slStatCardTrend><span slSparkline area size="lg" [data]="orders"></span></div>
          </div>
        </sl-dashboard-widget>
        <sl-dashboard-widget
          value="refunds"
          defaultColumns="3"
          detailHref="#refunds"
          [title]="t('Refunds', 'Reembolsos')"
          [defaultRows]="mode() === 'states' ? 3 : undefined"
          [status]="mode() === 'states' ? 'empty' : 'ready'"
          emptyDescription="No refund was issued this month."
        >
          <div slStatCard fill="plain" layout="stacked" size="sm" goodWhen="down" [delta]="0.163">
            <div slStatCardFigure>
              <span slStatCardValue [value]="128"></span>
              <span slStatCardDelta></span>
            </div>
            <div slStatCardTrend><span slSparkline area size="lg" [data]="refunds"></span></div>
          </div>
          <button
            slButton
            slDashboardWidgetEmptyAction
            size="sm"
            tone="secondary"
            variant="outline"
          >
            Record a refund
          </button>
        </sl-dashboard-widget>
        <!-- language: pt-BR -->
        <sl-dashboard-widget
          value="conversion"
          defaultColumns="3"
          retryable
          errorDescription="The analytics service did not answer in time."
          [title]="t('Conversion', 'Conversão')"
          [resizable]="mode() === 'constraints' ? false : undefined"
          [status]="mode() === 'states' && failed() ? 'error' : 'ready'"
          (retry)="failed.set(false)"
        >
          <!-- language: en-US -->
          <div slStatCard fill="plain" layout="stacked" size="sm" goodWhen="up" [delta]="-0.067">
            <div slStatCardFigure>
              <span slStatCardValue [value]="0.028" [formatOptions]="percent"></span>
              <span slStatCardDelta></span>
            </div>
            <div slStatCardTrend><span slSparkline area size="lg" [data]="conversion"></span></div>
          </div>
        </sl-dashboard-widget>
        <!-- language: pt-BR -->
        <sl-dashboard-widget
          value="trend"
          defaultColumns="8"
          defaultRows="4"
          detailHref="#trend"
          [minColumns]="4"
          [minRows]="mode() === 'constraints' ? 3 : undefined"
          [title]="t('Revenue by week', 'Receita por semana')"
          [description]="
            t('Last twelve weeks, all channels', 'Últimas doze semanas, todos os canais')
          "
        >
          <!-- language: en-US -->
          <figure
            slChart
            aria-label="Revenue by week"
            size="sm"
            toolbar="none"
            variant="plain"
            [data]="weekly"
            [legend]="false"
            [series]="weeklySeries"
            [x]="{ field: 'week' }"
            [y]="weeklyAxis"
          ></figure>
          @if (mode() === 'anatomy') {
            <p slDashboardWidgetFooter slText size="sm" tone="muted">Updated 4 minutes ago</p>
          }
        </sl-dashboard-widget>
        <!-- language: pt-BR -->
        <sl-dashboard-widget
          value="products"
          defaultColumns="4"
          defaultRows="4"
          [minColumns]="3"
          [title]="t('Top products', 'Produtos mais vendidos')"
          [removable]="mode() === 'constraints' ? false : undefined"
          [loading]="mode() === 'states'"
        >
          <!-- language: en-US -->
          <button slButton slDashboardWidgetActions size="sm" tone="secondary" variant="ghost">
            Export
          </button>
          <div slDashboardWidgetSkeleton slSkeletonText [lines]="8"></div>
          <div slTable variant="plain" [columns]="2">
            <div slTableContent>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableColumnHeader>Product</th>
                  <th slTableColumnHeader numeric>Revenue</th>
                </tr>
              </thead>
              <tbody slTableBody>
                @for (product of products; track product.name) {
                  <tr slTableRow [value]="product.name">
                    <th slTableRowHeader>{{ product.name }}</th>
                    <td slTableCell numeric>{{ product.amount }}</td>
                  </tr>
                }
              </tbody>
            </div>
          </div>
        </sl-dashboard-widget>
      </div>
      @if (controls()) {
        <p slText size="sm" tone="muted">{{ describe() }}</p>
      }
    </div>
  `,
})
class SalesDemo implements OnInit {
  readonly mode = input<Mode>('default');
  readonly startEditing = input(false);
  readonly initial = input<DashboardLayout>([]);
  readonly columns = input<number | undefined>(undefined);
  readonly editBar = input(true);
  readonly controls = input(true);

  protected readonly euro = EURO;
  protected readonly percent = PERCENT;
  protected readonly weeks = WEEKS;
  protected readonly weekly = WEEKS.map((thousands, index) => ({
    week: `W${index + 27}`,
    revenue: thousands * 1000,
  }));
  protected readonly weeklySeries = [{ kind: 'bar', field: 'revenue', label: 'Revenue' }] as const;
  protected readonly weeklyAxis = {
    format: { style: 'currency' as const, currency: 'EUR', notation: 'compact' as const },
  };
  protected readonly orders = ORDERS;
  protected readonly refunds = REFUNDS;
  protected readonly conversion = CONVERSION;
  protected readonly products = PRODUCTS;
  private readonly injector = inject(Injector);

  /* Only the persistence story reaches the store: the others must not write it. */
  protected persisted: ReturnType<typeof persistedDashboardLayout> | null = null;
  protected readonly own = signal<DashboardLayout | null>(null);
  private readonly stored = signal<DashboardLayout | null>(null);
  protected readonly layout = computed(() => this.stored() ?? this.own() ?? this.initial());
  protected readonly editing = signal(false);
  protected readonly failed = signal(true);
  protected readonly last = signal<DashboardLayoutRequest | null>(null);

  ngOnInit() {
    this.editing.set(this.startEditing());
    if (this.mode() !== 'persistence') return;
    this.persisted = persistedDashboardLayout({ key: 'trailhead-sales', injector: this.injector });
    this.stored.set(this.persisted.layout());
  }

  protected t(english: string, portuguese: string) {
    return this.mode() === 'labels' ? portuguese : english;
  }

  protected onLayout(next: DashboardLayout | undefined) {
    if (next === undefined) return;
    if (this.persisted !== null) {
      this.persisted.layout.set(next);
      this.stored.set(next);
    } else {
      this.own.set(next);
    }
  }

  protected describe() {
    const request = this.last();
    if (request === null) return 'No change yet.';
    return `layoutChangeRequest — kind: ${request.change.kind}, key: ${request.change.key ?? 'null'}, reason: ${request.reason}`;
  }
}

/* ── Template helpers ───────────────────────────────────────────────────── */

/** The ground a dashboard stands on: the page's sunken surface. */
function ground(body: string) {
  return `<div class="slotted-demo-surface" data-surface="sunken" data-flow="stack">${body}</div>`;
}

/** A room of a stated width, for the scene that shows the three size classes. */
function room(body: string, size: 'wide' | 'tablet' | 'phone') {
  return `<div class="slotted-demo-room" data-room="${size}"><div class="slotted-demo-viewport" data-size="content">${body}</div></div>`;
}

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

const one = (label: string, note: string, body: string) => ({
  template: grid(scene(label, note, ground(body))),
});

@Component({
  selector: 'sl-dashboard-labels-demo',
  standalone: true,
  imports: [SalesDemo],
  providers: [
    provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
    provideDashboardGridDefaults({ headingLevel: 2 }),
  ],
  template: `<sl-dashboard-sales-demo mode="labels" [startEditing]="true" />`,
})
class LabelsDemo {}

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DASHBOARD_GRID_DOCS['dashboard-grid'].scenes, {
    playground: Playground,
    anatomy: Anatomy,
    editing: Editing,
    keyboard: Keyboard,
    constraints: Constraints,
    states: States,
    responsive: Responsive,
    persistence: Persistence,
    labels: Labels,
    accessibility: Accessibility,
  });

interface DashboardStoryArgs {
  columns: number;
  editBar: boolean;
}

const meta: Meta<DashboardStoryArgs> = {
  title: 'Components/Dashboard Grid',
  decorators: [moduleMetadata({ imports: [SalesDemo, LabelsDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Dashboard Grid',
        description:
          'A surface of widgets the reader places and sizes. Each widget is a card with a title, its states and a way to its own page; an explicit edit mode lifts a widget to carry it to any cell, pulls it by its sides and corners, and does both from the keyboard and from a menu. The layout is kept by the application and serves every width: a grid of cells on a wide screen, a flow of halves on a tablet, one column on a phone.',
        framework: 'Angular',
        ...ANGULAR_DASHBOARD_GRID_DOCS['dashboard-grid'],
        tokens: ANGULAR_DASHBOARD_GRID_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DashboardStoryArgs>;

export const Playground: Story = {
  args: { columns: 12, editBar: true },
  argTypes: {
    columns: { control: 'inline-radio', options: [6, 8, 12] },
    editBar: { control: 'boolean' },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    ...one(
      'Trailhead’s sales overview',
      'Press Edit layout, pick up a card and carry it to another cell, pull a side or a corner, then Done; each request is written under the grid.',
      `<sl-dashboard-sales-demo [columns]="columns" [editBar]="editBar" />`,
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () =>
    one(
      'Every part, while editing',
      'The pill on each card’s top edge is its handle; its sides and bottom corners take a pull; Revenue by week carries a description, a footer and the detail link; Top products carries Export.',
      `<sl-dashboard-sales-demo mode="anatomy" [startEditing]="true" />`,
    ),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () =>
    one(
      'Rearranging, with a hidden widget',
      'Refunds was hidden earlier, so Add widget lists it. Carry a card and the others make room; Cancel returns the layout editing started from.',
      `<sl-dashboard-sales-demo [startEditing]="true" [initial]="[{ key: 'refunds', x: 6, y: 0, w: 3, h: 2, hidden: true }]" />`,
    ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () =>
    one(
      'Moving and resizing without a pointer',
      'Tab to the handle of Orders: Alt+ArrowRight moves it a column, Alt+ArrowDown trades places with the widget below, Shift+ArrowRight makes it wider, Enter opens the same choices as a menu.',
      `<sl-dashboard-sales-demo [startEditing]="true" />`,
    ),
};

export const Constraints: Story = {
  parameters: scenario('constraints'),
  render: () =>
    one(
      'Pinned, bounded, fixed and permanent',
      'Revenue is pinned: carry Orders onto it and Orders goes around. Revenue by week stops at four columns and three rows; Conversion has no edges to pull; Top products has no Hide.',
      `<sl-dashboard-sales-demo mode="constraints" [startEditing]="true" />`,
    ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () =>
    one(
      'A month that has not fully arrived',
      'Revenue waits under one block; Top products waits under its own rows; Orders refreshes under a moving line; Refunds is empty with its next step; Conversion failed — Try again brings it back.',
      `<sl-dashboard-sales-demo mode="states" [controls]="false" />`,
    ),
};

export const Responsive: Story = {
  parameters: scenario('responsive'),
  render: () => ({
    template: grid(
      scene(
        'Desktop, 1280 pixels',
        'Twelve columns: every widget at its own cell, four figures on a row, the chart beside the table.',
        room(ground(`<sl-dashboard-sales-demo [controls]="false" />`), 'wide'),
      ) +
        scene(
          'Tablet, 640 pixels',
          'The same order flowed in halves and wholes: two figures a row, the chart across, the table at half.',
          room(ground(`<sl-dashboard-sales-demo [controls]="false" />`), 'tablet'),
        ) +
        scene(
          'Phone, 375 pixels',
          'One column in the reading order, each widget as tall as its content; only the order can change here.',
          room(ground(`<sl-dashboard-sales-demo [controls]="false" />`), 'phone'),
        ),
    ),
  }),
};

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () =>
    one(
      'Stored under trailhead-sales',
      'Move or hide a widget and reload the page: the layout returns. Forget layout removes the entry and the defaults come back.',
      `<sl-dashboard-sales-demo mode="persistence" [startEditing]="true" />`,
    ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () =>
    one(
      'The sales dashboard, in Portuguese',
      'The language in force sets the bar, the handle’s name, the menu and the announcements once; the defaults provider makes the titles h2.',
      `<sl-dashboard-labels-demo />`,
    ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () =>
    one(
      'The page owns the controls',
      'With editBar off the instructions stay as each handle’s description; Done here calls commitEditing() through exportAs, and every change is still announced.',
      `<sl-dashboard-sales-demo mode="accessibility" [startEditing]="true" />`,
    ),
};
