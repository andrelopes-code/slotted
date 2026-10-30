import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import type { DismissableLayerHandle } from '@slotted/core/dismissable-layer';
import { createWidthGate } from '@slotted/core/measure';
import { createPresence } from '@slotted/core/presence';
import type { PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { SlAppShellBanner } from '@slotted/angular/app-shell';
import { injectMessages } from '@slotted/angular/i18n';
import {
  topNavigationMessages,
  type PartialMessages,
  type TopNavigationMessages,
} from '@slotted/core/i18n';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import {
  injectTopNavigationDefaults,
  SlTopNavigationIdFactory,
  TOP_NAVIGATION_COLLAPSE_AT,
} from './top-navigation-defaults';
import type {
  TopNavigationMoreReason,
  TopNavigationPriority,
  TopNavigationSearchReason,
  TopNavigationSize,
  TopNavigationValueReason,
} from './top-navigation-defaults';

export type {
  TopNavigationDefaults,
  TopNavigationMoreReason,
  TopNavigationPriority,
  TopNavigationSearchReason,
  TopNavigationSize,
  TopNavigationValueReason,
} from './top-navigation-defaults';

/** Every control a reader can land on in the bar, in DOM order. */
export const TOP_NAVIGATION_CONTROL_SELECTOR =
  '[data-part="skip"], [data-part="home"][href], [data-part="link"], [data-part="trigger"], [data-part="more"], [data-part="search"] input, [data-part="search-toggle"], [data-part="help"], [data-part="notifications"], [data-part="account"]';

/** What an item says about itself, for the count on `more` and the current mark. */
interface ItemRecord {
  current: boolean;
  order: number;
  priority: TopNavigationPriority;
}

/**
 * The bar across the top of an application: the mark, the context, the
 * destinations, the search and the global actions, folding by priority as
 * its own width goes.
 *
 * The directive goes on the consumer's own element — `<header slTopNavigation>`
 * standing alone, `<div slTopNavigation>` inside `app-shell`'s banner, which
 * is already the banner landmark and already paints the bar's ground.
 *
 * **Three values, three models.** `value` is the current destination,
 * `moreOpen` the panel and `searchOpen` the search. Which items fold is not a
 * fourth: it is read from the width and reported as a fact — `data-collapsed`
 * on the item, the count on `more`, `collapseChange` when the set moves.
 *
 * **The panel is the same DOM.** A folded item, the context and the help are
 * moved into the panel while it is present and moved back when it has left,
 * which is what the CDK's `DomPortalOutlet` does with a template's nodes.
 */
@Component({
  selector: '[slTopNavigation]',
  standalone: true,
  exportAs: 'slTopNavigation',
  template: `@if (skipTo()) {
      <a data-part="skip" data-part-skip="" [attr.href]="'#' + skipTo()">{{ t('skip') }}</a>
    }
    <ng-content />`,
  styleUrl: '../../../styles/src/top-navigation/top-navigation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'top-navigation',
    'data-ui-top-navigation': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-frame]': "resolvedFrame() ? '' : null",
    '[attr.data-search-open]': "searchTakesBar() ? '' : null",
  },
})
export class SlTopNavigation {
  /** The current destination's value. Two-way, so a template may bind it directly. */
  readonly value = model<string | null>(null);
  /** Whether the panel is shown. */
  readonly moreOpen = model<boolean>(false);
  /** Whether the search takes the bar, below the medium step. */
  readonly searchOpen = model<boolean>(false);

  readonly size = input<TopNavigationSize | undefined>(undefined);
  /**
   * Whether the root paints its own ground, rule and inset. Unstated, it does
   * on its own and does not inside `app-shell`'s banner.
   */
  readonly frame = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /**
   * Whether the root is the banner landmark. Unstated, it is one on its own and
   * not inside `app-shell`'s banner, which already is. The element is the
   * consumer's — `header` or `div` — and `landmark` decides nothing about it
   * here; it is read by the reference page and the tests as the intent.
   */
  readonly landmark = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (state) => (state === undefined ? undefined : booleanAttribute(state)),
  });
  /** The id of the element the skip link jumps to. Absent, no skip link is rendered. */
  readonly skipTo = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name, the names of the controls with no visible text, and the
   * skip link. A static `aria-label` on a part still wins.
   */
  readonly messages = input<PartialMessages<TopNavigationMessages> | undefined>(undefined);

  /** One output for one transition, carrying the reason and the event. */
  readonly valueChangeRequest = output<ChangeRequest<string | null>>();
  readonly moreOpenChangeRequest = output<ChangeRequest<boolean>>();
  readonly searchOpenChangeRequest = output<ChangeRequest<boolean>>();
  /** The folded set moved: the values, in DOM order. */
  readonly collapseChange = output<readonly string[]>();

  private readonly defaults = injectTopNavigationDefaults();
  private readonly shell = inject(SlAppShellBanner, { optional: true });
  readonly host: HTMLElement = inject(ElementRef).nativeElement;
  readonly ids = (() => {
    const id = inject(SlTopNavigationIdFactory).next();
    return { moreId: `${id}-more`, panelId: `${id}-panel` };
  })();

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedFrame = computed(
    () => this.frame() ?? (this.shell === null ? this.defaults.frame : false),
  );
  readonly resolvedLandmark = computed(
    () => this.landmark() ?? (this.shell === null ? this.defaults.landmark : false),
  );
  /** The family's words in the language in force, with this bar's `messages` laid over them. */
  readonly t = injectMessages(topNavigationMessages, this.messages);

  /** The three steps, measured: each gate reports once per crossing. */
  private readonly underLow = signal(false);
  private readonly underMedium = signal(false);
  private readonly underHigh = signal(false);
  /** Whether the width is under the medium step, where the search is its toggle and the context moves to the panel. */
  readonly narrow = this.underMedium.asReadonly();
  /** Whether the width is under the high step, where help moves to the panel. */
  readonly narrowest = this.underHigh.asReadonly();
  /** The priorities the width has folded. */
  readonly folded = computed(() => {
    const set = new Set<TopNavigationPriority>();
    if (this.underLow()) set.add('low');
    if (this.underMedium()) set.add('medium');
    if (this.underHigh()) set.add('high');
    return set;
  });

  private readonly items = signal<ReadonlyMap<string, ItemRecord>>(new Map());
  private order = 0;
  /** The values of the folded items, in DOM order. */
  readonly collapsed = computed(() =>
    [...this.items().entries()]
      .filter(([, record]) => this.folded().has(record.priority))
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([value]) => value),
  );
  /** Whether a folded item holds the current destination. */
  readonly currentFolded = computed(() => {
    const current = this.value();
    return [...this.items().entries()].some(
      ([value, record]) =>
        this.folded().has(record.priority) && (record.current || value === current),
    );
  });

  readonly hasSearch = signal(false);
  readonly hasContext = signal(false);
  readonly hasHelp = signal(false);
  /** Whether the panel has anything to show. */
  readonly panelHolds = computed(
    () =>
      this.collapsed().length > 0 ||
      (this.narrow() && this.hasContext()) ||
      (this.narrowest() && this.hasHelp()),
  );
  readonly searchTakesBar = computed(() => this.narrow() && this.hasSearch() && this.searchOpen());

  /** The panel, its list and the button that opens it, once they are in the document. */
  readonly panelNode = signal<HTMLElement | null>(null);
  readonly panelListNode = signal<HTMLElement | null>(null);
  readonly moreNode = signal<HTMLElement | null>(null);
  readonly searchNode = signal<HTMLElement | null>(null);
  readonly searchToggleNode = signal<HTMLElement | null>(null);

  private readonly panelStatus = signal<PresenceStatus>('unmounted');
  /** Whether the panel is present: open, or on its way out. */
  readonly panelPresent = computed(() => this.panelStatus() !== 'unmounted');
  private readonly presence = createPresence({
    present: false,
    onStatusChange: (next) => this.panelStatus.set(next),
  });
  private dismissable: DismissableLayerHandle | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    /* The gate measures once on creation and again on every resize where a ResizeObserver exists. */
    const gates = [
      createWidthGate(this.host, {
        at: TOP_NAVIGATION_COLLAPSE_AT.low,
        onChange: (narrow) => this.underLow.set(narrow),
      }),
      createWidthGate(this.host, {
        at: TOP_NAVIGATION_COLLAPSE_AT.medium,
        onChange: (narrow) => this.underMedium.set(narrow),
      }),
      createWidthGate(this.host, {
        at: TOP_NAVIGATION_COLLAPSE_AT.high,
        onChange: (narrow) => this.underHigh.set(narrow),
      }),
    ] as const;
    this.underLow.set(gates[0].narrow());
    this.underMedium.set(gates[1].narrow());
    this.underHigh.set(gates[2].narrow());
    destroyRef.onDestroy(() => {
      for (const gate of gates) gate.destroy();
    });

    /* The folded set is a fact the consumer is told about when it moves. */
    let reported: string | null = null;
    effect(() => {
      const collapsed = this.collapsed();
      const key = collapsed.join(' ');
      if (reported === key) return;
      const first = reported === null;
      reported = key;
      if (!first || collapsed.length > 0) this.collapseChange.emit(collapsed);
    });

    /* Nothing folded takes the panel with it: a transition, not a state. */
    let held = this.panelHolds();
    effect(() => {
      const holds = this.panelHolds();
      const before = held;
      held = holds;
      if (before && !holds && this.moreOpen()) this.setMoreOpen(false, 'resize');
    });

    /* The width passing the medium step takes the open search back to its place. */
    let wasNarrow = this.narrow();
    effect(() => {
      const narrow = this.narrow();
      const before = wasNarrow;
      wasNarrow = narrow;
      if (before && !narrow && this.searchOpen()) this.setSearchOpen(false, 'resize');
    });

    effect(() => this.presence.sync(this.moreOpen()));
    effect(() => this.presence.setNode(this.panelNode()));
    effect(() => this.stack());

    destroyRef.onDestroy(() => {
      this.presence.destroy();
      this.dismissable?.destroy();
      this.dismissable = null;
    });
  }

  /** An item says what it is. */
  registerItem(value: string, priority: TopNavigationPriority, current: boolean): () => void {
    this.items.update((previous) => {
      const next = new Map(previous);
      next.set(value, {
        current,
        order: previous.get(value)?.order ?? (this.order += 1),
        priority,
      });
      return next;
    });
    return () => {
      this.items.update((previous) => {
        if (!previous.has(value)) return previous;
        const next = new Map(previous);
        next.delete(value);
        return next;
      });
    };
  }

  /** The order an item registered in, so the panel keeps the list's order. */
  orderOf(value: string): number {
    return this.items().get(value)?.order ?? Number.MAX_SAFE_INTEGER;
  }

  /** Escape and a press outside close the panel; `more` is a branch, so a press on it toggles. */
  private stack() {
    const open = this.moreOpen();
    const panel = this.panelNode();
    const more = this.moreNode();
    this.dismissable?.destroy();
    this.dismissable = null;
    if (panel === null || !open) return;
    this.dismissable = createDismissableLayer(panel, {
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      ...(more ? { branches: [more] } : {}),
      onDismiss: (request) => {
        const reason: TopNavigationMoreReason =
          request.reason === 'escape' ? 'escape' : 'outsidePress';
        this.setMoreOpen(false, reason, request.source as Event | undefined);
        if (reason === 'escape') more?.focus();
      },
    });
  }

  /** Asks the panel to open or close. */
  setMoreOpen(next: boolean, reason: TopNavigationMoreReason, source?: Event) {
    const state = createControllable<boolean>({
      initial: this.moreOpen(),
      onRequest: (request) => this.moreOpenChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.moreOpen.set(next);
  }

  /** Asks the search to open or close. */
  setSearchOpen(next: boolean, reason: TopNavigationSearchReason, source?: Event) {
    const state = createControllable<boolean>({
      initial: this.searchOpen(),
      onRequest: (request) => this.searchOpenChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.searchOpen.set(next);
  }

  /** Asks the current destination to move. */
  select(next: string, reason: TopNavigationValueReason, source?: Event) {
    const state = createControllable<string | null>({
      initial: this.value(),
      onRequest: (request) => this.valueChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.value.set(next);
  }

  /** Opens the panel, with the reason `programmatic`. */
  openMore() {
    this.setMoreOpen(true, 'programmatic');
  }

  /** Closes the panel, with the reason `programmatic`. */
  closeMore() {
    this.setMoreOpen(false, 'programmatic');
  }

  /** Focuses the first control in the bar. */
  focus() {
    this.host.querySelector<HTMLElement>(TOP_NAVIGATION_CONTROL_SELECTOR)?.focus();
  }

  /** Opens the search where it is a toggle, and focuses the field either way. */
  focusSearch() {
    if (this.narrow() && this.hasSearch() && !this.searchOpen()) {
      this.setSearchOpen(true, 'programmatic');
      return;
    }
    this.searchNode()?.querySelector<HTMLElement>('input, [contenteditable]')?.focus();
  }
}
