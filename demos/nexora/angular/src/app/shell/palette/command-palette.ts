import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  SlCommandPalette,
  SlCommandPaletteEmpty,
  SlCommandPaletteItem,
  type CommandPaletteItem,
  type CommandPaletteSelectRequest,
} from '@slotted/angular/command-palette';
import { SlHighlight } from '@slotted/angular/highlight';
import type { CommandGroup } from '@slotted/core/commands';
import type { SearchHit, SearchResponse } from '@slotted/demo-nexora-backend';

import { visibleModules } from '../../core/nav/nav.model';
import { SearchService } from '../../core/search/search.service';
import { SessionStore } from '../../core/session/session.store';
import type { DemoDrawer } from '../demo/demo-drawer';

/** `route` rather than `href`: an `href` item is an anchor the family clicks natively, which would reload the app. */
export interface PaletteItem extends CommandPaletteItem {
  kind: 'go' | 'action' | 'demo' | 'recent' | 'hit';
  icon?: string;
  route?: string;
  hit?: SearchHit;
}

const SEARCH_GROUP_ORDER: readonly SearchHit['type'][] = [
  'customer',
  'contact',
  'order',
  'quote',
  'invoice',
  'product',
  'sku',
  'supplier',
  'purchase_order',
  'ticket',
];

const SEARCH_GROUP_LABELS: Record<SearchHit['type'], string> = {
  customer: 'Customers',
  contact: 'Contacts',
  order: 'Sales orders',
  quote: 'Quotes',
  invoice: 'Invoices',
  product: 'Products',
  sku: 'SKUs',
  supplier: 'Suppliers',
  purchase_order: 'Purchase orders',
  ticket: 'Tickets',
};

const ENTITY_ICON: Record<SearchHit['type'], string> = {
  customer: 'lucideBuilding2',
  contact: 'lucideUser',
  order: 'lucideShoppingCart',
  quote: 'lucideFileText',
  invoice: 'lucideReceipt',
  product: 'lucidePackage',
  sku: 'lucidePackage',
  supplier: 'lucideTruck',
  purchase_order: 'lucideClipboardList',
  ticket: 'lucideLifeBuoy',
};

@Component({
  selector: 'app-command-palette',
  imports: [NgIcon, SlCommandPalette, SlCommandPaletteEmpty, SlCommandPaletteItem, SlHighlight],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sl-command-palette
      [items]="items()"
      [groups]="groups()"
      [rank]="rank"
      [loading]="loading()"
      [(query)]="query"
      [(open)]="open"
      hotkey="mod+k"
      [messages]="messages"
      (select)="run($event)"
    >
      <ng-template slCommandPaletteEmpty>{{ emptyLabel() }}</ng-template>
      <ng-template slCommandPaletteItem let-item let-query="query">
        @let row = asRow(item);
        <span data-part="icon"><ng-icon [name]="row.icon ?? 'lucideCornerDownRight'" /></span>
        <span data-part="label"><span slHighlight [text]="row.label" [query]="query"></span></span>
        @if (row.description) {
          <span data-part="description">{{ row.description }}</span>
        }
        @if (row.meta) {
          <span data-part="meta">{{ row.meta }}</span>
        }
      </ng-template>
    </sl-command-palette>
  `,
})
export class CommandPalette {
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private readonly search = inject(SearchService);
  readonly palette = viewChild.required(SlCommandPalette);
  readonly drawer = signal<DemoDrawer | null>(null);

  readonly open = signal(false);
  readonly query = signal('');
  readonly loading = signal(false);
  readonly hits = signal<SearchResponse['groups']>([]);

  readonly groups = computed<CommandGroup[]>(() => [
    { id: 'recent', label: 'Recent' },
    { id: 'go', label: 'Go to' },
    { id: 'commands', label: 'Commands' },
    ...SEARCH_GROUP_ORDER.map((type) => ({ id: type, label: SEARCH_GROUP_LABELS[type] })),
  ]);

  readonly commands = computed<PaletteItem[]>(() => {
    void this.session.session();
    const modules = visibleModules((p) => this.session.can(p));
    const go: PaletteItem[] = modules.flatMap((m) => [
      {
        id: `go:${m.id}`,
        kind: 'go',
        label: `Go to ${m.label}`,
        group: 'go',
        icon: m.icon,
        route: m.destinations[0]?.path ?? m.path,
        keywords: [m.label.toLowerCase()],
      },
      ...(m.destinations.length > 1
        ? m.destinations.map(
            (x): PaletteItem => ({
              id: `go:${x.id}`,
              kind: 'go',
              label: `Go to ${m.label} › ${x.label}`,
              group: 'go',
              icon: m.icon,
              route: x.path,
              keywords: [x.label.toLowerCase()],
            }),
          )
        : []),
    ]);
    const actions: PaletteItem[] = (
      [
      { id: 'act:customer', kind: 'action', label: 'Create customer', group: 'commands', icon: 'lucidePlus', route: '/crm/customers/new', disabled: !this.session.can('customers.create') },
      { id: 'act:order', kind: 'action', label: 'Create sales order', group: 'commands', icon: 'lucidePlus', route: '/sales/orders?new=1', disabled: !this.session.can('orders.create') },
      { id: 'act:approvals', kind: 'action', label: 'Open approval queue', group: 'commands', icon: 'lucideClipboardCheck', route: '/sales/approvals', disabled: !this.session.canAny('orders.approve', 'quotes.approve') },
      { id: 'act:notifications', kind: 'action', label: 'Open notifications', group: 'commands', icon: 'lucideBell', route: '/notifications' },
      ] satisfies PaletteItem[]
    ).filter((a) => a.disabled !== true);
    const demo: PaletteItem[] = [
      { id: 'demo:persona', kind: 'demo', label: 'Switch persona…', group: 'commands', icon: 'lucideFlaskConical', description: 'Demo', onSelect: () => this.openDrawer('persona') },
      { id: 'demo:scenario', kind: 'demo', label: 'Change scenario…', group: 'commands', icon: 'lucideFlaskConical', description: 'Demo', onSelect: () => this.openDrawer('scenario') },
      { id: 'demo:reset', kind: 'demo', label: 'Reset demo data', group: 'commands', icon: 'lucideFlaskConical', description: 'Demo', onSelect: () => this.openDrawer('reset') },
      { id: 'demo:open', kind: 'demo', label: 'Open demo controls', group: 'commands', icon: 'lucideFlaskConical', shortcut: 'mod+shift+d', onSelect: () => this.openDrawer() },
    ];
    return [...go, ...actions, ...demo];
  });

  readonly recent = computed<PaletteItem[]>(() =>
    this.search.recent().map((d) => ({
      id: `recent:${d.id}`,
      kind: 'recent',
      label: d.title,
      group: 'recent',
      icon: ENTITY_ICON[d.type],
      ...(d.number === undefined ? {} : { meta: d.number }),
      hit: d,
      route: this.search.routeFor(d),
    })),
  );

  readonly hitItems = computed<PaletteItem[]>(() =>
    this.hits().flatMap((g) =>
      g.hits.map(
        (h): PaletteItem => ({
          id: `hit:${h.id}`,
          kind: 'hit',
          label: h.title,
          group: h.type,
          icon: ENTITY_ICON[h.type],
          ...(h.number === undefined ? {} : { meta: h.number }),
          description: h.subtitle,
          hit: h,
          route: this.search.routeFor(h),
          keywords: [h.title.toLowerCase(), h.subtitle.toLowerCase(), h.number?.toLowerCase() ?? ''],
        }),
      ),
    ),
  );

  readonly items = computed<PaletteItem[]>(() => {
    const q = this.query().trim();
    if (q.length === 0) return [...this.recent(), ...this.commands()];
    return [...this.commands(), ...this.hitItems()];
  });

  readonly emptyLabel = computed(() => `Nothing matches “${this.query()}”`);

  /** The palette's own words, in the shell's voice. */
  readonly messages = {
    label: 'Search or jump to',
    placeholder: 'Search customers, orders, invoices… or type a command',
    hintNavigate: 'navigate',
    hintSelect: 'open',
    hintClose: 'close',
  };

  /** Hits are already ranked by the backend; commands match on label and keywords. */
  readonly rank = (item: PaletteItem, query: string): number | null => {
    if (item.kind === 'hit') return 1;
    if (item.kind === 'recent') return query.length === 0 ? 1 : null;
    const q = query.toLowerCase();
    if (item.label.toLowerCase().includes(q)) return 2;
    return item.keywords?.some((k) => k.includes(q)) ? 1 : null;
  };

  constructor() {
    effect(() => {
      const q = this.query().trim();
      void this.runSearch(q);
    });
  }

  async runSearch(q: string): Promise<void> {
    if (q.length < 2) {
      this.hits.set([]);
      return;
    }
    this.loading.set(true);
    try {
      const groups = await this.search.search(q);
      if (groups !== null) this.hits.set(groups);
    } finally {
      this.loading.set(false);
    }
  }

  run(request: CommandPaletteSelectRequest<PaletteItem>): void {
    const item = request.item;
    if (item.hit !== undefined) this.search.remember(item.hit);
    if (item.route !== undefined) void this.router.navigateByUrl(item.route);
  }

  /** The item template is typed on the family's base item; the rows here are always ours. */
  asRow(item: CommandPaletteItem): PaletteItem {
    return item as PaletteItem;
  }

  openDrawer(section?: 'persona' | 'scenario' | 'reset'): void {
    this.drawer()?.openAt(section);
  }
}
