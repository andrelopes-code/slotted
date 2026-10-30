import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { tabbables } from '@slotted/core/focus';
import { timelineMessages, type PartialMessages, type TimelineMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  connectorOf,
  feedFocusTarget,
  formatTimestamp,
  isComplete,
  revealFocusIndex,
  setSizeOf,
  sideOf,
} from '@slotted/core/timeline';
import type {
  TimelineConnector,
  TimelineGrowing,
  TimelineOrder,
  TimelinePlacement,
  TimelineSide,
  TimelineTimeFormat,
  TimestampValue,
} from '@slotted/core/timeline';

import {
  injectTimelineDefaults,
  TIMELINE_DEFAULT_GROWING,
  TIMELINE_DEFAULT_LEVEL,
  TIMELINE_DEFAULT_MODE,
  TIMELINE_DEFAULT_ORDER,
  TIMELINE_DEFAULT_ORIENTATION,
  TIMELINE_DEFAULT_PLACEMENT,
  TIMELINE_DEFAULT_SIZE,
  TIMELINE_DEFAULT_TIME_FORMAT,
  TIMELINE_DEFAULT_TONE,
  TIMELINE_DEFAULT_VARIANT,
  type TimelineLevel,
  type TimelineLoadMoreReason,
  type TimelineMode,
  type TimelineOpenReason,
  type TimelineOrientation,
  type TimelineRevealReason,
  type TimelineSize,
  type TimelineTone,
  type TimelineVariant,
} from './timeline.constants';

let counter = 0;

/**
 * An ordered list of events on one line, each with a marker, a machine
 * timestamp and a body — and, in feed mode, the APG Feed pattern drawn the
 * same way.
 *
 * **It is an `ol`, or a feed, and `mode` decides which.** The consumer writes
 * the list element, so the mode says which one: `ol[slTimelineList]` with
 * `li[slTimelineItem]` in list mode, `div[slTimelineList]` with
 * `article[slTimelineItem]` in feed mode — a `li` admits no `article` role.
 * In feed mode the list is `role="feed"`, every article carries its position,
 * the set size and its label, the feed is busy while more is on its way, and
 * `PageDown`, `PageUp`, `Control+End` and `Control+Home` do what the pattern
 * says.
 *
 * **It never reverses the array.** `order` says what the list is, and it is
 * what decides where `autoComplete` cuts.
 *
 * **It holds no events.** Loading more and revealing fresh ones are outputs
 * with a reason and nothing to hold; the consumer owns the array. The one
 * mutable value is whether a group is open, on `slTimelineGroup`.
 */
@Component({
  selector: '[slTimeline]',
  standalone: true,
  template: `
    @if (heldCount() > 0) {
      <button
        #fresh
        data-part="fresh"
        data-part-fresh=""
        type="button"
        [hidden]="freshCount() <= 0"
        (click)="reveal($event)"
      >
        {{ t('freshItems', { count: heldCount() }) }}
      </button>
    }
    <ng-content></ng-content>
    @if (growingValue() !== 'none') {
      @if (loading()) {
        <div #more aria-live="polite" data-part="more" data-part-more="">
          <span
            aria-hidden="true"
            data-part="root"
            data-part-root=""
            data-ui="spinner"
            data-ui-spinner=""
            ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="8.875" />
              <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
          ></span>
          {{ t('loading') }}
        </div>
      } @else if (growingValue() === 'button') {
        <button #more data-part="more" data-part-more="" type="button" (click)="loadMore($event)">
          {{ t('loadMore') }}
        </button>
      } @else {
        <div #more data-part="more" data-part-more=""></div>
      }
    }
    @if (loaded() === 0 && !loading()) {
      <div data-part="empty" data-part-empty="">
        <ng-content select="[slTimelineEmpty]">{{ t('empty') }}</ng-content>
      </div>
    }
  `,
  styleUrls: [
    '../../../styles/src/timeline/timeline.css',
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slTimeline',
  host: {
    'data-ui': 'timeline',
    'data-ui-timeline': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-mode]': 'modeValue()',
    '[attr.data-orientation]': 'orientationValue()',
    '[attr.data-placement]': 'placementValue()',
    '[attr.data-order]': 'orderValue()',
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-tone]': 'toneValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-growing]': 'growingValue()',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-reflow]': 'reflow() ? null : "false"',
  },
})
export class SlTimeline {
  readonly mode = input<TimelineMode | undefined>(undefined);
  readonly orientation = input<TimelineOrientation | undefined>(undefined);
  readonly placement = input<TimelinePlacement | undefined>(undefined);
  readonly order = input<TimelineOrder | undefined>(undefined);
  readonly variant = input<TimelineVariant | undefined>(undefined);
  readonly tone = input<TimelineTone | undefined>(undefined);
  readonly size = input<TimelineSize | undefined>(undefined);
  readonly growing = input<TimelineGrowing | undefined>(undefined);
  readonly timeFormat = input<TimelineTimeFormat | undefined>(undefined);
  /** For the timestamps; defaults to the language in force (`provideSlotted`). */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly now = input(undefined, { transform: optionalNumber });
  readonly level = input(undefined, { transform: optionalLevel });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * more control, the waiting line, the fresh pill, the empty line, the
   * current event's mark and a folded group's trigger.
   */
  readonly messages = input<PartialMessages<TimelineMessages> | undefined>(undefined);
  /** The accessible name of the list. */
  readonly label = input<string | undefined>(undefined);
  /** The total number of events, when the application knows it. */
  readonly count = input(undefined, { transform: optionalNumber });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly freshCount = input(0, { transform: numberAttribute });
  readonly autoComplete = input(false, { transform: booleanAttribute });
  readonly reflow = input(true, { transform: booleanAttribute });

  /** Asked when the reader presses the more control, or scrolls to it. */
  readonly loadMoreRequest = output<{ reason: TimelineLoadMoreReason; event?: Event }>();
  /** Asked when the reader presses the pill that holds fresh events. */
  readonly revealRequest = output<{ reason: TimelineRevealReason; event?: Event }>();

  private readonly defaults = injectTimelineDefaults();
  private readonly destroyRef = inject(DestroyRef);
  private readonly moreElement = viewChild<ElementRef<HTMLElement>>('more');
  private readonly freshElement = viewChild<ElementRef<HTMLButtonElement>>('fresh');
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly items = signal<readonly SlTimelineItem[]>([]);

  readonly id = `slotted-timeline-${(counter += 1)}`;

  readonly modeValue = computed(() => this.mode() ?? this.defaults.mode ?? TIMELINE_DEFAULT_MODE);
  readonly orientationValue = computed(
    () => this.orientation() ?? this.defaults.orientation ?? TIMELINE_DEFAULT_ORIENTATION,
  );
  readonly placementValue = computed(
    () => this.placement() ?? this.defaults.placement ?? TIMELINE_DEFAULT_PLACEMENT,
  );
  readonly orderValue = computed(
    () => this.order() ?? this.defaults.order ?? TIMELINE_DEFAULT_ORDER,
  );
  readonly variantValue = computed(
    () => this.variant() ?? this.defaults.variant ?? TIMELINE_DEFAULT_VARIANT,
  );
  readonly toneValue = computed(() => this.tone() ?? this.defaults.tone ?? TIMELINE_DEFAULT_TONE);
  readonly sizeValue = computed(() => this.size() ?? this.defaults.size ?? TIMELINE_DEFAULT_SIZE);
  readonly growingValue = computed(
    () => this.growing() ?? this.defaults.growing ?? TIMELINE_DEFAULT_GROWING,
  );
  readonly timeFormatValue = computed(
    () => this.timeFormat() ?? this.defaults.timeFormat ?? TIMELINE_DEFAULT_TIME_FORMAT,
  );
  private readonly runtimeLocale = injectLocale();
  readonly localeValue = computed(() => this.locale() ?? this.runtimeLocale());
  readonly timeZoneValue = computed(() => this.timeZone() ?? this.defaults.timeZone);
  readonly nowValue = computed(() => this.now() ?? this.defaults.now);
  readonly levelValue = computed(
    () => this.level() ?? this.defaults.level ?? TIMELINE_DEFAULT_LEVEL,
  );
  /** The family's words in the language in force, with this timeline's `messages` laid over them. */
  readonly t = injectMessages(timelineMessages, this.messages);
  readonly feed = computed(() => this.modeValue() === 'feed');

  /**
   * The pill's last count, kept past the change that drops it to zero: the
   * pill stays mounted from its first appearance, hidden at zero with the
   * words it had, so it can leave with a transition instead of vanishing.
   */
  readonly heldCount = linkedSignal<number, number>({
    source: this.freshCount,
    computation: (count, previous) => (count > 0 ? count : (previous?.value ?? 0)),
  });

  /** How many events the list laid out. */
  readonly loaded = computed(() => this.items().length);
  /** The index of the event marked current, in DOM order, or -1. */
  readonly currentIndex = computed(() => this.items().findIndex((item) => item.current()));

  constructor() {
    /** Fresh events are announced once per change of the count, politely. */
    effect(() => {
      const count = this.freshCount();
      if (count <= 0) return;
      getLiveAnnouncer().announce(untracked(() => this.t('freshItems', { count })));
    });

    /**
     * A reader who pressed the pill is taken to the first event it revealed,
     * not left on a control that is hiding. Whether focus is on the pill is
     * read now, before the view hides it; the event is focused once the view
     * has rendered what the reveal added.
     */
    let previousFresh = 0;
    effect(() => {
      const count = this.freshCount();
      const revealed = previousFresh;
      previousFresh = count;
      if (count > 0 || revealed <= 0) return;
      const pill = untracked(() => this.freshElement())?.nativeElement;
      if (pill === undefined || !pill.contains(pill.ownerDocument.activeElement)) return;
      afterNextRender({ write: () => this.focusRevealed(revealed) }, { injector: this.injector });
    });

    /**
     * `growing="scroll"` asks when the end of the loaded list enters the
     * scrollport. Only where the observer exists: a server, or a test without
     * one, asks for nothing and the consumer who needs a control there
     * declares `button`.
     */
    effect((onCleanup) => {
      const more = this.moreElement()?.nativeElement;
      if (this.growingValue() !== 'scroll' || more === undefined || this.loading()) return;
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMoreRequest.emit({ reason: 'scroll' });
        }
      });
      observer.observe(more);
      onCleanup(() => observer.disconnect());
    });
    this.destroyRef.onDestroy(() => this.items.set([]));
  }

  register(items: readonly SlTimelineItem[]) {
    this.items.set(items);
  }

  itemId(index: number, part: string) {
    return `${this.id}-${index}-${part}`;
  }

  loadMore(event: Event) {
    const reason: TimelineLoadMoreReason =
      (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
    this.loadMoreRequest.emit({ event, reason });
  }

  private focusRevealed(revealed: number) {
    const all = [...this.host.querySelectorAll<HTMLElement>('[data-part="item"]')].filter(
      (article) => article.closest('[data-part="group-list"][hidden]') === null,
    );
    const index = revealFocusIndex({ loaded: all.length, revealed, order: this.orderValue() });
    const event = index === null ? undefined : all[index];
    if (event === undefined) return;
    (event.hasAttribute('tabindex') ? event : tabbables(event)[0])?.focus();
  }

  reveal(event: Event) {
    const reason: TimelineRevealReason =
      (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
    this.revealRequest.emit({ event, reason });
  }
}

/**
 * Every event that lays out under a list, in DOM order, is indexed by the one
 * list that sees them all; the last event of each list — the root's or a
 * group's — is told so by the list it is a direct child of, because it draws
 * no connector.
 */
function assignLast(items: readonly SlTimelineItem[]) {
  for (const [index, item] of items.entries()) {
    item.last.set(index === items.length - 1);
  }
}

/**
 * The list: an `ol`, or a `div` that is a feed. It carries the name, the busy
 * state and the feed keys, and it is the one part that sees every event, so
 * it is what numbers them.
 */
@Directive({
  selector: 'ol[slTimelineList], div[slTimelineList]',
  standalone: true,
  exportAs: 'slTimelineList',
  host: {
    'data-part': 'list',
    'data-part-list': '',
    '[attr.id]': 'timeline.id',
    '[attr.role]': 'timeline.feed() ? "feed" : null',
    '[attr.aria-label]': 'accessibleLabel()',
    '[attr.aria-busy]': 'timeline.feed() && timeline.loading() ? "true" : null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SlTimelineList {
  readonly timeline = inject(SlTimeline);
  private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly ownLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  private readonly all = contentChildren<SlTimelineItem>(
    forwardRef(() => SlTimelineItem),
    { descendants: true },
  );
  private readonly own = contentChildren<SlTimelineItem>(forwardRef(() => SlTimelineItem));

  readonly accessibleLabel = computed(() =>
    this.ownLabel !== null || this.ownLabelledBy !== null ? null : (this.timeline.label() ?? null),
  );

  constructor() {
    effect(() => {
      const items = this.all();
      this.timeline.register(items);
      for (const [index, item] of items.entries()) item.index.set(index);
    });
    effect(() => assignLast(this.own()));
  }

  /** The articles a key can reach: every one not inside a folded group. */
  articles(): HTMLElement[] {
    return [...this.element.querySelectorAll<HTMLElement>('[data-part="item"]')].filter(
      (article) => article.closest('[data-part="group-list"][hidden]') === null,
    );
  }

  focusItem(index: number) {
    this.articles()[index]?.focus();
  }

  onKeydown(raw: Event) {
    const event = raw as KeyboardEvent;
    if (event.defaultPrevented || !this.timeline.feed()) return;
    const all = this.articles();
    const from = all.findIndex((article) => article.contains(event.target as Node));
    const target = feedFocusTarget({
      count: all.length,
      ctrlKey: event.ctrlKey,
      from,
      key: event.key,
      metaKey: event.metaKey,
    });
    if (target === null) return;
    event.preventDefault();
    if (typeof target === 'number') {
      all[target]?.focus();
      return;
    }
    const list = this.element;
    const page = tabbables(list.ownerDocument.body);
    const outside =
      target === 'after'
        ? page.find(
            (candidate) =>
              list.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING &&
              !list.contains(candidate),
          )
        : [...page]
            .reverse()
            .find(
              (candidate) =>
                list.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_PRECEDING &&
                !list.contains(candidate),
            );
    outside?.focus();
  }
}

/**
 * A period: a heading and its own list of events. `collapsible` makes the
 * heading a disclosure — a `button` with `aria-expanded` and `aria-controls`
 * — and the list takes `hidden` when it is closed rather than leaving the
 * DOM. `open` is the family's one mutable value: `[(open)]` for the value,
 * `(openRequest)` for the request that carries the reason and can be
 * cancelled.
 */
@Component({
  selector: 'li[slTimelineGroup], div[slTimelineGroup]',
  standalone: true,
  template: `
    @switch (levelValue()) {
      @case (2) {
        <h2 data-part="group-label" data-part-group-label="">
          <ng-container *ngTemplateOutlet="heading"></ng-container>
        </h2>
      }
      @case (4) {
        <h4 data-part="group-label" data-part-group-label="">
          <ng-container *ngTemplateOutlet="heading"></ng-container>
        </h4>
      }
      @case (5) {
        <h5 data-part="group-label" data-part-group-label="">
          <ng-container *ngTemplateOutlet="heading"></ng-container>
        </h5>
      }
      @case (6) {
        <h6 data-part="group-label" data-part-group-label="">
          <ng-container *ngTemplateOutlet="heading"></ng-container>
        </h6>
      }
      @default {
        <h3 data-part="group-label" data-part-group-label="">
          <ng-container *ngTemplateOutlet="heading"></ng-container>
        </h3>
      }
    }
    <ng-content></ng-content>

    <ng-template #heading>
      @if (collapsible()) {
        <button
          [attr.aria-controls]="listId"
          [attr.aria-expanded]="isOpen()"
          data-part="group-trigger"
          data-part-group-trigger=""
          type="button"
          (click)="toggle($event)"
        >
          <span aria-hidden="true" data-part="group-indicator" data-part-group-indicator=""
            ><span slIcon><svg slGlyph name="chevron-down"></svg></span
          ></span>
          {{ label()
          }}<span data-ui="visually-hidden" data-ui-visually-hidden="">{{
            isOpen() ? timeline.t('collapse') : timeline.t('expand')
          }}</span>
        </button>
      } @else {
        {{ label() }}
      }
    </ng-template>
  `,
  imports: [NgTemplateOutlet, SlGlyph, SlIcon],
  styleUrls: [
    '../../../styles/src/timeline/timeline.css',
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slTimelineGroup',
  host: {
    'data-part': 'group',
    'data-part-group': '',
    '[attr.data-open]': 'isOpen() ? "" : null',
  },
})
export class SlTimelineGroup {
  readonly timeline = inject(SlTimeline);

  /** The period's name, as the heading. */
  readonly label = input.required<string>();
  readonly level = input(undefined, { transform: optionalLevel });
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Present means controlled, for the life of the group. */
  readonly open = model<boolean | undefined>(undefined);
  /** Where an uncontrolled group starts, read once. */
  readonly defaultOpen = input(true, { transform: booleanAttribute });
  /** Emitted before the group moves, with the request that carries the reason. */
  readonly openRequest = output<ChangeRequest<boolean>>();

  private readonly own = signal<boolean | undefined>(undefined);
  readonly listId = `${this.timeline.id}-group-${(counter += 1)}`;

  readonly levelValue = computed(() => this.level() ?? this.timeline.levelValue());
  readonly isOpen = computed(
    () => !this.collapsible() || (this.open() ?? this.own() ?? this.defaultOpen()),
  );

  toggle(event: Event) {
    const reason: TimelineOpenReason = (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
    this.setOpen(!this.isOpen(), reason, event);
  }

  setOpen(next: boolean, reason: TimelineOpenReason = 'programmatic', source?: Event) {
    const state = createControllable<boolean>({
      controlled: untracked(() => this.open()),
      initial: untracked(() => this.isOpen()),
      onRequest: (request) => this.openRequest.emit(request),
    });
    if (state.request(next, reason, source)) {
      this.own.set(next);
      this.open.set(next);
    }
  }
}

/** The list inside a group: hidden while the group is folded. */
@Directive({
  selector: 'ol[slTimelineGroupList], div[slTimelineGroupList]',
  standalone: true,
  exportAs: 'slTimelineGroupList',
  host: {
    'data-part': 'group-list',
    'data-part-group-list': '',
    '[attr.id]': 'group.listId',
    '[hidden]': '!group.isOpen()',
  },
})
export class SlTimelineGroupList {
  readonly group = inject(SlTimelineGroup);
  private readonly own = contentChildren<SlTimelineItem>(forwardRef(() => SlTimelineItem));

  constructor() {
    effect(() => assignLast(this.own()));
  }
}

/**
 * One event: its marker on the rail, the line to the next one, and its body.
 * The body's parts are inputs for the plain case — `title`, `description`,
 * `actor`, `time` — and projected content for the rich one, each under its
 * own directive, so a title can be a link and an actor an avatar.
 *
 * In feed mode it is an `article` and a tab stop, labelled by its title, its
 * actor and its time and described by its description, with its position in
 * the set.
 */
@Component({
  selector: 'li[slTimelineItem], article[slTimelineItem]',
  standalone: true,
  imports: [forwardRef(() => SlTimelineTime), SlGlyph, SlIcon],
  /*
   * A finished dot's check is the marker's default content, which projected
   * artwork replaces. `data-check` tells the sheet it is the family's own, so
   * the marker stays a dot rather than becoming a badge.
   */
  template: `
    <ng-content select="[slTimelineOpposite]"></ng-content>
    <div data-part="rail" data-part-rail="">
      <span data-part="marker" data-part-marker="">
        @if (loading()) {
          <span
            aria-hidden="true"
            data-part="root"
            data-part-root=""
            data-ui="spinner"
            data-ui-spinner=""
            ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="8.875" />
              <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
          ></span>
        } @else {
          <ng-content select="[slTimelineMarker]">
            @if (finished() && !current()) {
              <span slIcon data-check=""><svg slGlyph name="check"></svg></span>
            }
          </ng-content>
        }
      </span>
      @if (!last()) {
        <span aria-hidden="true" data-part="connector" data-part-connector=""></span>
      }
    </div>
    <div data-part="content" data-part-content="">
      @if (title() !== undefined) {
        <div data-part="title" data-part-title="" [id]="partId('title')">{{ title() }}</div>
      }
      <ng-content select="[slTimelineTitle]"></ng-content>
      @if (current()) {
        <span data-ui="visually-hidden" data-ui-visually-hidden="" [id]="partId('current')">{{
          timeline.t('current')
        }}</span>
      }
      @if (time() !== undefined) {
        @if (timeLabel() !== undefined) {
          <time slTimelineTime [id]="partId('time')" [value]="time()!">{{ timeLabel() }}</time>
        } @else {
          <time slTimelineTime [id]="partId('time')" [value]="time()!"></time>
        }
      }
      @if (actor() !== undefined) {
        <div data-part="actor" data-part-actor="" [id]="partId('actor')">{{ actor() }}</div>
      }
      <ng-content select="[slTimelineActor]"></ng-content>
      @if (description() !== undefined) {
        <div data-part="description" data-part-description="" [id]="partId('description')">
          {{ description() }}
        </div>
      }
      <ng-content select="[slTimelineDescription]"></ng-content>
      <ng-content></ng-content>
      <ng-content select="[slTimelineActions]"></ng-content>
    </div>
  `,
  styleUrls: [
    '../../../styles/src/timeline/timeline.css',
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slTimelineItem',
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.role]': 'timeline.feed() ? "article" : null',
    '[attr.tabindex]': 'timeline.feed() ? (ownTabindex ?? "0") : null',
    '[attr.aria-posinset]': 'timeline.feed() ? index() + 1 : null',
    '[attr.aria-setsize]': 'timeline.feed() ? setSize() : null',
    '[attr.aria-labelledby]': 'timeline.feed() ? labelledBy() : null',
    '[attr.aria-describedby]': 'timeline.feed() ? describedBy() : null',
    '[attr.aria-current]': 'current() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.data-current]': 'current() ? "" : null',
    '[attr.data-complete]': 'finished() && !current() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.data-connector]': 'line() === "solid" ? null : line()',
    '[attr.data-side]': 'sideValue()',
    '[attr.data-tone]': 'tone() ?? timeline.toneValue()',
    '[attr.data-variant]': 'variant() ?? timeline.variantValue()',
  },
})
export class SlTimelineItem {
  readonly timeline = inject(SlTimeline);
  readonly ownTabindex = inject(new HostAttributeToken('tabindex'), { optional: true });

  readonly title = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly actor = input<string | undefined>(undefined);
  /** When it happened. Written to `datetime` and formatted for the reader. */
  readonly time = input<TimestampValue | undefined>(undefined);
  /** What the reader sees in place of the formatted time. */
  readonly timeLabel = input<string | undefined>(undefined);
  readonly current = input(false, { transform: booleanAttribute });
  /** Whether this event is finished. Outranks the derivation. */
  readonly complete = input(undefined, { transform: optionalBoolean });
  readonly loading = input(false, { transform: booleanAttribute });
  /** The line after this event; `dashed` is derived for the future side. */
  readonly connector = input<TimelineConnector | undefined>(undefined);
  /** Which side the body takes in `alternate`; parity otherwise. */
  readonly side = input<TimelineSide | undefined>(undefined);
  readonly tone = input<TimelineTone | undefined>(undefined);
  readonly variant = input<TimelineVariant | undefined>(undefined);

  /** Written by the list that sees every event. */
  readonly index = signal(0);
  /** Written by the list this event is a direct child of. */
  readonly last = signal(true);

  private readonly projectedTitle = contentChild(forwardRef(() => SlTimelineTitle));
  private readonly projectedActor = contentChild(forwardRef(() => SlTimelineActor));
  private readonly projectedDescription = contentChild(forwardRef(() => SlTimelineDescription));

  readonly finished = computed(() =>
    isComplete({
      autoComplete: this.timeline.autoComplete(),
      complete: this.complete(),
      currentIndex: this.timeline.currentIndex(),
      index: this.index(),
      order: this.timeline.orderValue(),
    }),
  );
  readonly line = computed(() =>
    connectorOf({
      autoComplete: this.timeline.autoComplete(),
      connector: this.connector(),
      currentIndex: this.timeline.currentIndex(),
      index: this.index(),
      order: this.timeline.orderValue(),
    }),
  );
  readonly sideValue = computed(() =>
    this.timeline.placementValue() === 'alternate' || this.side() !== undefined
      ? sideOf(this.timeline.placementValue(), this.index(), this.side())
      : null,
  );
  readonly setSize = computed(() =>
    setSizeOf({
      count: this.timeline.count(),
      growing: this.timeline.growingValue(),
      loaded: this.timeline.loaded(),
    }),
  );
  readonly labelledBy = computed(() => {
    const ids = [
      this.title() !== undefined || this.projectedTitle() !== undefined
        ? this.partId('title')
        : null,
      this.current() ? this.partId('current') : null,
      this.actor() !== undefined || this.projectedActor() !== undefined
        ? this.partId('actor')
        : null,
      this.time() !== undefined ? this.partId('time') : null,
    ].filter((id): id is string => id !== null);
    return ids.length === 0 ? null : ids.join(' ');
  });
  readonly describedBy = computed(() =>
    this.description() !== undefined || this.projectedDescription() !== undefined
      ? this.partId('description')
      : null,
  );

  partId(part: string) {
    return this.timeline.itemId(this.index(), part);
  }
}

/**
 * When it happened, as the platform reads it and as the reader does. The
 * machine value always goes to `datetime`; the text is the family's
 * formatting unless the consumer projected their own, and a relative reading
 * keeps the absolute one in `title`. Outside a timeline it still works, from
 * the locale in force and the runtime's zone.
 */
@Component({
  selector: 'time[slTimelineTime]',
  standalone: true,
  template: '<ng-content>{{ formatted().text }}</ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slTimelineTime',
  host: {
    'data-part': 'time',
    'data-part-time': '',
    '[attr.datetime]': 'formatted().dateTime',
    '[attr.title]': 'formatted().title',
  },
})
export class SlTimelineTime {
  private readonly timeline = inject(SlTimeline, { optional: true });
  private readonly runtimeLocale = injectLocale();

  readonly value = input.required<TimestampValue>();
  readonly format = input<TimelineTimeFormat | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  readonly now = input(undefined, { transform: optionalNumber });

  readonly formatted = computed(() =>
    formatTimestamp(this.value(), {
      format: this.format() ?? this.timeline?.timeFormatValue(),
      locale: this.locale() ?? this.timeline?.localeValue() ?? this.runtimeLocale(),
      now: this.now() ?? this.timeline?.nowValue(),
      timeZone: this.timeZone() ?? this.timeline?.timeZoneValue(),
    }),
  );
}

/**
 * The body's parts as the consumer's own elements: a title that is a link, an
 * actor that is an avatar beside a name, a description with markup, a row of
 * buttons, content for the other side of the rail, artwork for the marker.
 * Each directive writes the part and the id the article is labelled by.
 */
@Directive({
  selector: '[slTimelineTitle]',
  standalone: true,
  host: { 'data-part': 'title', 'data-part-title': '', '[attr.id]': 'item.partId("title")' },
})
export class SlTimelineTitle {
  readonly item = inject(SlTimelineItem);
}

@Directive({
  selector: '[slTimelineActor]',
  standalone: true,
  host: { 'data-part': 'actor', 'data-part-actor': '', '[attr.id]': 'item.partId("actor")' },
})
export class SlTimelineActor {
  readonly item = inject(SlTimelineItem);
}

@Directive({
  selector: '[slTimelineDescription]',
  standalone: true,
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[attr.id]': 'item.partId("description")',
  },
})
export class SlTimelineDescription {
  readonly item = inject(SlTimelineItem);
}

@Directive({
  selector: '[slTimelineActions]',
  standalone: true,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlTimelineActions {}

@Directive({
  selector: '[slTimelineOpposite]',
  standalone: true,
  host: { 'data-part': 'opposite', 'data-part-opposite': '' },
})
export class SlTimelineOpposite {}

/** Artwork projected into the marker; the marker itself is the family's. */
@Directive({ selector: '[slTimelineMarker]', standalone: true })
export class SlTimelineMarker {}

/** What stands in for the list while it has no events. */
@Directive({ selector: '[slTimelineEmpty]', standalone: true })
export class SlTimelineEmpty {}

/** Absence has to survive the transform, so an unset input stays unset. */
function optionalBoolean(value: boolean | string | undefined) {
  return value === undefined ? undefined : booleanAttribute(value);
}

function optionalNumber(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalLevel(value: number | string | undefined): TimelineLevel | undefined {
  const parsed = optionalNumber(value);
  return parsed === 2 || parsed === 3 || parsed === 4 || parsed === 5 || parsed === 6
    ? parsed
    : undefined;
}
