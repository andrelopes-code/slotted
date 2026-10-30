import {
  pageHeaderMessages,
  type PageHeaderMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createStickyHeader } from '@slotted/core/sticky-header';
import type { StickyHeaderHandle } from '@slotted/core/sticky-header';
import { SlContainer } from '@slotted/angular/container';
import { injectMessages } from '@slotted/angular/i18n';
import { SlPage } from '@slotted/angular/page';
import {
  afterNextRender,
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
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import { injectPageHeaderDefaults, SlPageHeaderIdFactory } from './page-header-defaults';
import type {
  PageHeaderCollapse,
  PageHeaderExpandedReason,
  PageHeaderLevel,
  PageHeaderPinnedReason,
  PageHeaderSize,
  PageHeaderVariant,
} from './page-header-defaults';

export type {
  PageHeaderCollapse,
  PageHeaderDefaults,
  PageHeaderExpandedReason,
  PageHeaderLevel,
  PageHeaderPinnedReason,
  PageHeaderSize,
  PageHeaderVariant,
} from './page-header-defaults';

type MovedBy = 'control' | 'pin' | 'programmatic' | 'scroll';

/** Absence survives the transform, so the provider's default can apply. */
const optionalBoolean = (given: boolean | string | undefined) =>
  given === undefined ? undefined : booleanAttribute(given);

/**
 * The shell of a screen's top: a title area that never leaves, a header area
 * that scrolls away under it and comes back, a pill of controls on the
 * chrome's edge, and a slot for tabs. SAP Fiori's Dynamic Page, rebuilt on one
 * sticky root.
 *
 * **The stylesheet does the moving.** The root is `position: sticky` with a
 * negative offset the size of the header area, measured into
 * `--slotted-page-header-collapse` by `@slotted/core/sticky-header`, which
 * the React binding drives the same way. Scrolling takes the area under the
 * title and leaves the title where it is.
 *
 * **Two values a template may bind.** `expanded` moves by the toggle, by the
 * pin, by the application and by the scroll; `pinned` by the pin and the
 * application. Each move is first a request on `expandedRequest` or
 * `pinnedRequest`, carrying the reason — `scroll` is a reason of its own — and
 * `cancel()`.
 */
@Component({
  selector: '[slPageHeader]',
  standalone: true,
  exportAs: 'slPageHeader',
  imports: [SlContainer],
  template: `<div slContainer [size]="containerSize()" [inset]="containerInset()">
    <ng-content />
  </div>`,
  styleUrl: '../../../styles/src/page-header/page-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'page-header',
    'data-ui-page-header': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-level]': 'resolvedLevel()',
    '[attr.data-collapse]': 'resolvedCollapse()',
    '[attr.data-expanded]': "expanded() ? '' : null",
    '[attr.data-revealed]': "revealed() ? '' : null",
    '[attr.data-scrolled]': "scrolled() ? '' : null",
    '[attr.data-tall]': "tall() ? '' : null",
    '[attr.data-compact]': "compact() ? '' : null",
    '[attr.data-stuck]': "stuck() ? '' : null",
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.data-material]': "resolvedMaterial() ? '' : null",
    '[attr.aria-busy]': "loading() ? 'true' : null",
  },
})
export class SlPageHeader {
  /** Whether the header area is open. Two-way, so a template may bind it directly. */
  readonly expanded = model<boolean>(true);
  /** Whether the pin holds the area open. Two-way. */
  readonly pinned = model<boolean>(false);
  readonly variant = input<PageHeaderVariant | undefined>(undefined);
  readonly size = input<PageHeaderSize | undefined>(undefined);
  readonly level = input<PageHeaderLevel | undefined>(undefined);
  readonly collapse = input<PageHeaderCollapse | undefined>(undefined);
  /**
   * Stuck, the chrome is the theme's material — `--slotted-surface-material`
   * behind `--slotted-material-backdrop` — in every variant; at rest each
   * variant keeps its ground. Defaults to the provider, then `false`.
   */
  readonly material = input(undefined, { transform: optionalBoolean });
  /**
   * Whether the title has not arrived yet. The heading, the subheading and the
   * description render `slSkeletonText` in place of their words; the actions
   * stay operable; the root carries `aria-busy`.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * toggle, the pin and the header area's name. A static `aria-label` on a
   * part still wins.
   */
  readonly messages = input<PartialMessages<PageHeaderMessages> | undefined>(undefined);

  /** One output for one transition of the header area, carrying the reason and the event. */
  readonly expandedRequest = output<ChangeRequest<boolean>>();
  /** One output for one transition of the pin, carrying the reason and the event. */
  readonly pinnedRequest = output<ChangeRequest<boolean>>();

  private readonly defaults = injectPageHeaderDefaults();
  private readonly page = inject(SlPage, { optional: true });
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly generated = inject(SlPageHeaderIdFactory).next();

  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedMaterial = computed(() => this.material() ?? this.defaults.material);
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedLevel = computed(() => this.level() ?? this.defaults.level);
  readonly resolvedCollapse = computed(() => this.collapse() ?? this.defaults.collapse);
  /** The family's words in the language in force, with this header's `messages` laid over them. */
  readonly t = injectMessages(pageHeaderMessages, this.messages);

  protected readonly containerSize = computed(() => this.page?.resolvedWidth() ?? 'content');
  protected readonly containerInset = computed(() => this.page?.resolvedInset());

  /** Whether the scroll has passed the area — a measured fact. */
  readonly scrolled = signal(false);
  /** The header is too much of the screen to hold; the pin is hidden and a held header let go. */
  readonly tall = signal(false);
  /** The frame is narrower than the compact size class — a phone; the header is in the flow and nothing condenses it. */
  readonly compact = signal(false);
  /** Whether the area is shown whole in place although the scroll has passed it. */
  readonly revealed = signal(false);
  /** Whether content passes under the chrome — a measured fact `plain` and `floating` read. */
  readonly stuck = signal(false);

  private engine: StickyHeaderHandle | null = null;
  /** Who asked for the move the next change detection will show. */
  private expandedBy: MovedBy = 'programmatic';

  /** The identifiers that wire the toggle to the area and the root to its heading. */
  ids() {
    return { areaId: `${this.generated}-area`, headingId: `${this.generated}-heading` };
  }

  constructor() {
    const destroyRef = inject(DestroyRef);

    /* The engine is told once a value has actually changed, whoever changed it. */
    let seenExpanded = untracked(() => this.expanded());
    effect(() => {
      const expanded = this.expanded();
      if (expanded === seenExpanded) return;
      seenExpanded = expanded;
      this.engine?.expandedChanged(expanded, this.expandedBy);
      this.expandedBy = 'programmatic';
    });
    let seenPinned = untracked(() => this.pinned());
    effect(() => {
      const pinned = this.pinned();
      if (pinned === seenPinned) return;
      seenPinned = pinned;
      this.engine?.pinnedChanged(pinned);
    });

    afterNextRender(() => {
      const part = (name: string) =>
        this.native.querySelector<HTMLElement>(`:scope > * > [data-part="${name}"]`);
      const attach = () => {
        this.engine?.destroy();
        this.engine = createStickyHeader({
          root: this.native,
          area: () => part('header-area'),
          chrome: () =>
            [part('title-area'), part('controls'), part('tabs')].filter(
              (element): element is HTMLElement => element !== null,
            ),
          state: () => ({
            expanded: this.expanded(),
            pinned: this.pinned(),
            collapse: this.resolvedCollapse(),
          }),
          onScrolled: (next) => this.scrolled.set(next),
          onRevealed: (next) => this.revealed.set(next),
          onStuck: (next) => this.stuck.set(next),
          onScrollRequest: (next) => this.request(next, 'scroll', undefined, 'scroll'),
          onTall: (next) => this.tall.set(next),
          onCompact: (next) => this.compact.set(next),
          onPinRequest: (next) => this.requestPinned(next, 'programmatic'),
          contained: () => this.filledBody(),
        });
      };
      attach();
      destroyRef.onDestroy(() => this.engine?.destroy());
    });

    /* The axis rebuilds the engine, because it decides which observers exist. */
    effect(() => {
      this.resolvedCollapse();
      untracked(() => this.engine?.refresh());
    });
  }

  /**
   * The body of the page this header heads, while that page fills: nothing
   * scrolls outside it there, so its principal scroller is what snaps the area.
   * Read from the DOM on every scroll, so a page that turns `fill` on or off
   * is followed without rebuilding the engine.
   */
  private filledBody(): HTMLElement | null {
    const page = this.native.closest<HTMLElement>('[data-ui="page"]');
    if (page === null || !page.hasAttribute('data-fill')) return null;
    return page.querySelector<HTMLElement>(':scope > [data-part="scroll"] > [data-part="body"]');
  }

  private request(
    next: boolean,
    reason: PageHeaderExpandedReason,
    source: Event | undefined,
    by: MovedBy,
  ) {
    if (next === this.expanded()) return;
    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.expanded(),
      onRequest: (request) => {
        this.expandedRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    this.expandedBy = by;
    this.expanded.set(next);
  }

  private requestPinned(next: boolean, reason: PageHeaderPinnedReason, source?: Event) {
    if (next === this.pinned()) return;
    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.pinned(),
      onRequest: (request) => {
        this.pinnedRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    this.pinned.set(next);
    /* A pinned header is by definition an open one. */
    if (next && !this.expanded()) this.request(true, 'programmatic', source, 'pin');
  }

  /** Asks the header area to open or close, carrying the reason and the originating event. */
  setExpanded(next: boolean, reason: PageHeaderExpandedReason, source?: Event) {
    /* Collapsing by the toggle while pinned lets the pin go first. */
    if (!next && this.pinned()) this.requestPinned(false, 'programmatic', source);
    this.request(next, reason, source, reason === 'programmatic' ? 'programmatic' : 'control');
  }

  /** Asks the pin to take hold or let go, carrying the reason and the originating event. */
  setPinned(next: boolean, reason: PageHeaderPinnedReason, source?: Event) {
    this.requestPinned(next, reason, source);
  }

  /** Opens the header area, carrying `programmatic`. Scrolled past, it reveals it in place. */
  expand() {
    this.request(true, 'programmatic', undefined, 'programmatic');
  }

  /** Closes the header area, carrying `programmatic`. */
  collapseArea() {
    if (this.pinned()) this.requestPinned(false, 'programmatic');
    this.request(false, 'programmatic', undefined, 'programmatic');
  }

  /** Takes hold, carrying `programmatic`; a collapsed area opens with it. */
  pin() {
    this.requestPinned(true, 'programmatic');
  }

  /** Lets go, carrying `programmatic`. */
  unpin() {
    this.requestPinned(false, 'programmatic');
  }
}
