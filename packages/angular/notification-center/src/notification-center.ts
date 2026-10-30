import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';
import { SlButton } from '@slotted/angular/button';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlSkeleton, SlSkeletonText } from '@slotted/angular/skeleton';
import { SlTab, SlTabList, SlTabs } from '@slotted/angular/tabs';
import { tabbables } from '@slotted/core/focus';
import {
  notificationCenterMessages,
  type NotificationCenterMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { feedFocusTarget, formatTimestamp, setSizeOf } from '@slotted/core/timeline';
import type { FormattedTimestamp } from '@slotted/core/timeline';

import {
  injectNotificationCenterDefaults,
  SlNotificationCenterIdFactory,
  type NotificationCenterArrivals,
  type NotificationCenterControls,
  type NotificationCenterGrowing,
  type NotificationCenterItemRequest,
  type NotificationCenterLevel,
  type NotificationCenterLoadReason,
  type NotificationCenterPressReason,
  type NotificationCenterReadReason,
  type NotificationCenterReadRequest,
  type NotificationCenterRequest,
  type NotificationCenterRevealRequest,
  type NotificationCenterSize,
  type NotificationCenterTimeFormat,
  type NotificationCenterTone,
  type NotificationCenterViewReason,
  type NotificationItem,
  type NotificationView,
} from './notification-center-defaults';
import { SlNotificationControl } from './notification-control';

/** How many skeleton rows stand in while nothing has arrived. */
const WAITING_ROWS = [0, 1, 2];

/**
 * The family's own visual for an item with a tone and no visual of its own,
 * as the contract's `toneGlyph` names it: every glyph a circle.
 */
const TONE_GLYPH: Record<NotificationCenterTone, GlyphName> = {
  accent: 'circle-info',
  secondary: 'bell',
  info: 'circle-info',
  success: 'circle-check',
  warning: 'circle-alert',
  danger: 'circle-x',
};

/** What an item template is handed. */
export interface NotificationItemContext {
  $implicit: NotificationItem;
  /** Its position in the feed, from one. */
  position: number;
  /** The tone the family resolved for it. */
  tone: NotificationCenterTone;
  /** The formatted time: the machine value and the words. */
  time: FormattedTimestamp;
  /** The ids the family wrote, for `aria-labelledby` and `aria-describedby`. */
  ids: { title: string; description: string };
}

/** An identifier a key can be part of: word characters and hyphens stay, the rest is spelled out. */
function escapeKey(key: string): string {
  return key.replace(/[^\w-]/g, (character) => `-${character.charCodeAt(0).toString(16)}-`);
}

function createRequest<Reason extends string>(
  reason: Reason,
  event: Event | undefined,
): NotificationCenterRequest<Reason> {
  let cancelled = false;
  return {
    reason,
    event,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** A click with no coordinates is a key. */
function pressReason(event: Event): NotificationCenterPressReason {
  return (event as MouseEvent).detail === 0 ? 'keyboard' : 'pointer';
}

interface Group {
  label: string;
  items: NotificationItem[];
}

/** The items filed under their labels, in the order the labels first appear. */
function groupItems(
  items: readonly NotificationItem[],
  groupBy: (item: NotificationItem) => string,
): Group[] {
  const groups: Group[] = [];
  const byLabel = new Map<string, Group>();
  for (const item of items) {
    const label = groupBy(item);
    let group = byLabel.get(label);
    if (group === undefined) {
      group = { label, items: [] };
      byLabel.set(label, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

/**
 * Substitutes an item's content — the words between the visual and the
 * controls; the article, its wiring and its controls stay the family's.
 *
 * ```html
 * <ng-template slNotificationItem let-item let-time="time" let-ids="ids">
 *   <span data-part="title" [id]="ids.title">{{ item.title }}</span>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[slNotificationItem]', standalone: true })
export class SlNotificationItem {
  readonly template = inject(TemplateRef<NotificationItemContext>);
}

/**
 * The visual of an item: an avatar, an icon. Absent, an item with a tone
 * gets the family's glyph; one without gets no visual.
 */
@Directive({ selector: 'ng-template[slNotificationVisual]', standalone: true })
export class SlNotificationVisual {
  readonly template = inject(TemplateRef<NotificationItemContext>);
}

/** The consumer's controls for an item, under its body. */
@Directive({ selector: 'ng-template[slNotificationActions]', standalone: true })
export class SlNotificationActions {
  readonly template = inject(TemplateRef<NotificationItemContext>);
}

/**
 * The persistent list of what happened while the reader was not looking.
 *
 * **It holds none of the facts.** `items` is the consumer's array: whether an
 * item is read, whether it exists, how many there are. Marking, removing,
 * opening, revealing and loading are outputs with a reason, and the store
 * answers by changing the array.
 *
 * **One value moves: the view.** `[(view)]` for the value, `(viewRequest)`
 * for the request that carries the reason and can be cancelled; the
 * built-in `all` and `unread` when the consumer states no views. The strip
 * is `tabs` holding its list alone; the feed is its one panel.
 *
 * **Arrivals are held while the reader reads.** Under `arrivals="hold"` a
 * key the family has not shown, arriving while focus is inside the feed or
 * the feed's scroller is past its start, waits behind `fresh` with a polite
 * announcement; otherwise it shows at once.
 *
 * **The feed is the APG pattern.** `role="feed"`, an `article` per item with
 * its position and the set's size, `PageDown` and `PageUp` between articles,
 * `Control+End` and `Control+Home` out of the feed, `Delete` to ask for a
 * removal, and `aria-busy` while a page is on its way.
 */
@Component({
  selector: '[slNotificationCenter]',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SlButton,
    SlGlyph,
    SlIcon,
    SlNotificationControl,
    SlSkeleton,
    SlSkeletonText,
    SlTab,
    SlTabList,
    SlTabs,
  ],
  template: `
    <div data-part="header" data-part-header="">
      @switch (levelValue()) {
        @case ('3') {
          <h3 data-part="title" data-part-title="" [id]="titleId">
            {{ t('title') }}
            @if (unread() > 0) {
              <span data-part="count" data-part-count="">{{ unread() }}</span>
            }
          </h3>
        }
        @case ('4') {
          <h4 data-part="title" data-part-title="" [id]="titleId">
            {{ t('title') }}
            @if (unread() > 0) {
              <span data-part="count" data-part-count="">{{ unread() }}</span>
            }
          </h4>
        }
        @default {
          <h2 data-part="title" data-part-title="" [id]="titleId">
            {{ t('title') }}
            @if (unread() > 0) {
              <span data-part="count" data-part-count="">{{ unread() }}</span>
            }
          </h2>
        }
      }
      <span data-part="mark-all" data-part-mark-all="">
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="ghost"
          type="button"
          [disabled]="unread() === 0"
          (click)="markAll($event)"
        >
          {{ t('markAll') }}
        </button>
      </span>
      <ng-content select="[slNotificationCenterActions]" />
    </div>
    @if (viewList().length > 1) {
      <div data-part="views" data-part-views="">
        <div
          slTabs
          track="none"
          [size]="sizeValue()"
          [value]="currentView()"
          (valueChange)="forwardView($event)"
        >
          <div slTabList [attr.aria-label]="t('views')">
            @for (entry of viewList(); track entry.value) {
              <div slTab [value]="entry.value" [controls]="feedId">
                {{ entry.label }}
                @if (entry.count !== undefined && entry.count > 0) {
                  &ngsp;<span data-part="count" data-part-count="">{{ entry.count }}</span>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
    @if (held().length > 0) {
      <button
        #fresh
        data-part="fresh"
        data-part-fresh=""
        type="button"
        (click)="reveal(pressReason($event), $event)"
      >
        {{ t('fresh', { count: held().length }) }}
      </button>
    }
    <div
      #feed
      data-part="feed"
      data-part-feed=""
      role="feed"
      [id]="feedId"
      [attr.aria-labelledby]="titleId"
      [attr.aria-busy]="loading() ? 'true' : null"
      (keydown)="onFeedKeydown($event)"
    >
      @if (waiting()) {
        @for (row of waitingRows; track row) {
          <div data-part="item" data-part-item="" aria-hidden="true">
            <span data-part="visual" data-part-visual=""
              ><span slSkeleton shape="circle" size="sm"></span
            ></span>
            <div data-part="content" data-part-content="">
              <span slSkeletonText [lines]="2"></span>
            </div>
          </div>
        }
      } @else if (groupBy() === undefined) {
        @for (item of visibleItems(); track item.key; let index = $index) {
          <ng-container
            [ngTemplateOutlet]="article"
            [ngTemplateOutletContext]="{ $implicit: item, position: index + 1 }"
          />
        }
      } @else {
        @for (group of groups(); track group.label; let offset = $index) {
          <div data-part="group" data-part-group="">
            @switch (levelValue()) {
              @case ('3') {
                <h4 data-part="group-label" data-part-group-label="">{{ group.label }}</h4>
              }
              @case ('4') {
                <h5 data-part="group-label" data-part-group-label="">{{ group.label }}</h5>
              }
              @default {
                <h3 data-part="group-label" data-part-group-label="">{{ group.label }}</h3>
              }
            }
            @for (item of group.items; track item.key; let index = $index) {
              <ng-container
                [ngTemplateOutlet]="article"
                [ngTemplateOutletContext]="{ $implicit: item, position: positionOf(group, index) }"
              />
            }
          </div>
        }
      }
    </div>
    @if (showEmpty()) {
      <div data-part="empty" data-part-empty="">
        <ng-content select="[slNotificationCenterEmpty]">{{ emptyWords() }}</ng-content>
      </div>
    } @else if (growingValue() !== 'none') {
      @if (loading()) {
        <div #more aria-live="polite" data-part="more" data-part-more="">{{ t('loading') }}</div>
      } @else if (growingValue() === 'button') {
        <button #more data-part="more" data-part-more="" type="button" (click)="loadMore($event)">
          {{ t('loadMore') }}
        </button>
      } @else {
        <div #more data-part="more" data-part-more=""></div>
      }
    }
    <ng-content select="[slNotificationCenterFooter]" />

    <ng-template #article let-item let-position="position">
      @let context = contextOf(item, position);
      <article
        data-part="item"
        data-part-item=""
        tabindex="0"
        [attr.data-key]="item.key"
        [attr.data-tone]="context.tone"
        [attr.data-read]="item.read ? '' : null"
        [attr.aria-labelledby]="context.ids.title"
        [attr.aria-describedby]="item.description ? context.ids.description : null"
        [attr.aria-posinset]="position"
        [attr.aria-setsize]="setSize()"
      >
        @if (visualTemplate(); as visual) {
          <span data-part="visual" data-part-visual="" [attr.data-tone]="item.tone ?? null">
            <ng-container
              [ngTemplateOutlet]="visual.template"
              [ngTemplateOutletContext]="context"
            />
          </span>
        } @else if (item.tone !== undefined) {
          <span data-part="visual" data-part-visual="" [attr.data-tone]="item.tone"
            ><span slIcon data-tone-glyph=""><svg slGlyph [name]="toneGlyph(item.tone)"></svg></span
          ></span>
        }
        <div data-part="content" data-part-content="">
          @if (itemTemplate(); as own) {
            <ng-container [ngTemplateOutlet]="own.template" [ngTemplateOutletContext]="context" />
          } @else {
            @if (item.href === undefined) {
              <span data-part="title" data-part-title="" [id]="context.ids.title">{{
                item.title
              }}</span>
            } @else {
              <a
                data-part="title"
                data-part-title=""
                [id]="context.ids.title"
                [attr.href]="item.href"
                (click)="open(item.key, $event)"
                >{{ item.title }}</a
              >
            }
            @if (item.description) {
              <p data-part="description" data-part-description="" [id]="context.ids.description">
                {{ item.description }}
              </p>
            }
            <time
              data-part="time"
              data-part-time=""
              [attr.datetime]="context.time.dateTime"
              [attr.title]="context.time.title"
              >{{ context.time.text }}</time
            >
            @if (actionsTemplate(); as actions) {
              <div data-part="actions" data-part-actions="">
                <ng-container
                  [ngTemplateOutlet]="actions.template"
                  [ngTemplateOutletContext]="context"
                />
              </div>
            }
          }
        </div>
        @if (controlsValue() !== 'none') {
          <div data-part="controls" data-part-controls="">
            @if (controlsValue() !== 'dismiss') {
              <button
                slNotificationControl
                data-part="read-toggle"
                data-part-read-toggle=""
                [text]="item.read ? t('markUnread') : t('markRead')"
                (click)="requestRead([item.key], !item.read, pressReason($event), $event)"
              >
                <span slIcon><svg slGlyph [name]="item.read ? 'dot' : 'check'"></svg></span>
              </button>
            }
            @if (controlsValue() !== 'read') {
              <button
                slNotificationControl
                data-part="dismiss"
                data-part-dismiss=""
                [text]="t('dismiss')"
                (click)="remove(item.key, pressReason($event), $event)"
              >
                <span slIcon><svg slGlyph name="x"></svg></span>
              </button>
            }
          </div>
        }
      </article>
    </ng-template>
  `,
  styleUrl: '../../../styles/src/notification-center/notification-center.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slNotificationCenter',
  host: {
    'data-ui': 'notification-center',
    'data-ui-notification-center': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-level]': 'levelValue()',
    '[attr.data-growing]': 'growingValue()',
    '[attr.data-arrivals]': 'arrivalsValue()',
    '[attr.data-time-format]': 'timeFormatValue()',
    '[attr.data-controls]': 'controlsValue()',
    '[attr.data-view]': 'currentView()',
    '[attr.data-loading]': "loading() ? '' : null",
    '[attr.aria-labelledby]': 'labelledBy()',
  },
})
export class SlNotificationCenter {
  /** The consumer's array. The family holds none of its facts. */
  readonly items = input.required<readonly NotificationItem[]>();
  /** The strip's entries. Unstated, the built-in `all` and `unread`; one entry draws no strip. */
  readonly views = input<readonly NotificationView[] | undefined>(undefined);
  readonly size = input<NotificationCenterSize | undefined>(undefined);
  readonly level = input<NotificationCenterLevel | undefined>(undefined);
  readonly growing = input<NotificationCenterGrowing | undefined>(undefined);
  readonly arrivals = input<NotificationCenterArrivals | undefined>(undefined);
  readonly timeFormat = input<NotificationCenterTimeFormat | undefined>(undefined);
  readonly controls = input<NotificationCenterControls | undefined>(undefined);
  /** For the time; defaults to the language in force (`provideSlotted`). */
  readonly locale = input<string | undefined>(undefined);
  readonly timeZone = input<string | undefined>(undefined);
  /** The instant a relative time is measured from. State it for a stable server render. */
  readonly now = input<number | undefined>(undefined);
  /** `aria-busy` on the feed; skeleton rows while nothing is loaded, the waiting row under growing otherwise. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** How many items exist in all, for `aria-setsize`. */
  readonly count = input<number | undefined>(undefined);
  /** Groups the feed: the label an item is filed under, in the order the items give. */
  readonly groupBy = input<((item: NotificationItem) => string) | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * heading, the controls, the views, the empty pages and the announcements.
   */
  readonly messages = input<PartialMessages<NotificationCenterMessages> | undefined>(undefined);
  /** The view an unbound center starts on, read once. */
  readonly defaultView = input<string | undefined>(undefined);
  /** The current view. Two-way, so a template may bind it directly. */
  readonly view = model<string | undefined>(undefined);

  /** One output for one move of the view, carrying the reason; cancellable. */
  readonly viewRequest = output<ChangeRequest<string | undefined>>();
  /** The keys and the value the family asks for. The store answers by changing `items`. */
  readonly readRequest = output<NotificationCenterReadRequest>();
  /** Asked before an item is removed. The family removes nothing. */
  readonly removeRequest = output<NotificationCenterItemRequest>();
  /** Asked before a title link navigates. Cancelling keeps the reader here. */
  readonly openRequest = output<NotificationCenterItemRequest>();
  /** Asked before held arrivals are shown, with their count. */
  readonly revealRequest = output<NotificationCenterRevealRequest>();
  /** Asked when the reader presses the more control, or scrolls to it. */
  readonly loadMoreRequest = output<NotificationCenterRequest<NotificationCenterLoadReason>>();
  /** A fact for the bell: the unread count among the items, whenever it changes. */
  readonly unreadChange = output<number>();

  private readonly defaults = injectNotificationCenterDefaults();
  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  private readonly feedElement = viewChild<ElementRef<HTMLElement>>('feed');
  private readonly freshElement = viewChild<ElementRef<HTMLButtonElement>>('fresh');
  private readonly moreElement = viewChild<ElementRef<HTMLElement>>('more');
  protected readonly itemTemplate = contentChild(SlNotificationItem);
  protected readonly visualTemplate = contentChild(SlNotificationVisual);
  /**
   * The tone's glyph, for an item with no visual of its own. `data-tone-glyph`
   * tells the sheet the glyph is the family's, not the consumer's.
   */
  protected toneGlyph(tone: NotificationCenterTone): GlyphName {
    return TONE_GLYPH[tone];
  }
  protected readonly actionsTemplate = contentChild(SlNotificationActions);

  readonly id = inject(SlNotificationCenterIdFactory).next();
  readonly titleId = `${this.id}-title`;
  readonly feedId = `${this.id}-feed`;
  protected readonly waitingRows = WAITING_ROWS;

  readonly sizeValue = computed(() => this.size() ?? this.defaults.size);
  readonly levelValue = computed(() => this.level() ?? this.defaults.level);
  readonly growingValue = computed(() => this.growing() ?? this.defaults.growing);
  readonly arrivalsValue = computed(() => this.arrivals() ?? this.defaults.arrivals);
  readonly timeFormatValue = computed(() => this.timeFormat() ?? this.defaults.timeFormat);
  readonly controlsValue = computed(() => this.controls() ?? this.defaults.controls);
  private readonly runtimeLocale = injectLocale();
  readonly localeValue = computed(() => this.locale() ?? this.runtimeLocale());
  readonly timeZoneValue = computed(() => this.timeZone() ?? this.defaults.timeZone);
  /** The family's words in the language in force, with this center's `messages` laid over them. */
  readonly t = injectMessages(notificationCenterMessages, this.messages);

  /** The unread count among every item, held or shown. */
  readonly unread = computed(() => this.items().filter((item) => !item.read).length);
  readonly viewList = computed<readonly NotificationView[]>(
    () =>
      this.views() ?? [
        { label: this.t('all'), value: 'all' },
        { count: this.unread(), label: this.t('unreadView'), value: 'unread' },
      ],
  );
  /** The view: the model, then defaultView, then the first entry. */
  readonly currentView = computed(
    () => this.view() ?? this.defaultView() ?? this.viewList()[0]?.value ?? 'all',
  );

  /** The keys the family has shown; a key outside it and outside `held` has just arrived. */
  private readonly shown = signal<ReadonlySet<string>>(new Set());
  /** The keys held behind `fresh`, in the order they arrived. */
  readonly held = signal<readonly string[]>([]);
  private pendingFocus: string | null = null;

  readonly shownItems = computed(() => {
    if (this.arrivalsValue() !== 'hold') return this.items();
    const shown = this.shown();
    return this.items().filter((item) => shown.has(item.key));
  });
  readonly visibleItems = computed(() =>
    this.currentView() === 'unread'
      ? this.shownItems().filter((item) => !item.read)
      : this.shownItems(),
  );
  protected readonly groups = computed(() => {
    const groupBy = this.groupBy();
    return groupBy === undefined ? [] : groupItems(this.visibleItems(), groupBy);
  });
  readonly setSize = computed(() =>
    setSizeOf({
      count: this.count(),
      growing: this.growingValue(),
      loaded: this.visibleItems().length,
    }),
  );
  protected readonly waiting = computed(() => this.loading() && this.visibleItems().length === 0);
  protected readonly showEmpty = computed(
    () => !this.waiting() && this.visibleItems().length === 0,
  );
  protected readonly emptyWords = computed(() =>
    this.currentView() === 'unread' ? this.t('caughtUp') : this.t('empty'),
  );
  protected readonly labelledBy = computed(() =>
    this.writtenLabel !== null || this.writtenLabelledBy !== null
      ? this.writtenLabelledBy
      : this.titleId,
  );

  constructor() {
    /*
     * A key the family has not shown is either held or shown. Keys that
     * left the array leave both sets. The first array is shown whole: nobody
     * was reading before there was anything to read.
     */
    let first = true;
    effect(() => {
      const keys = new Set(this.items().map((item) => item.key));
      const shown = untracked(() => this.shown());
      const held = untracked(() => this.held());
      const fresh = [...keys].filter((key) => !shown.has(key) && !held.includes(key));
      const kept = held.filter((key) => keys.has(key));
      const holding = untracked(() => this.arrivalsValue()) === 'hold';
      if (fresh.length > 0 && holding && !first && untracked(() => this.reading())) {
        this.held.set([...kept, ...fresh]);
      } else {
        if (fresh.length > 0) this.shown.set(new Set([...shown, ...fresh]));
        if (kept.length !== held.length) this.held.set(kept);
      }
      first = false;
    });

    /** Held arrivals are announced once per change of the count, politely. */
    effect(() => {
      const count = this.held().length;
      if (count === 0) return;
      getLiveAnnouncer().announce(untracked(() => this.t('fresh', { count })));
    });

    /** The unread count is a fact for the bell, reported on the first read and on every change. */
    let reported: number | null = null;
    effect(() => {
      const count = this.unread();
      if (reported === count) return;
      const initial = reported === null;
      reported = count;
      this.unreadChange.emit(count);
      if (!initial) getLiveAnnouncer().announce(untracked(() => this.t('unread', { count })));
    });

    /** A keyboard reveal moves focus to the first revealed article once it is in the DOM. */
    afterRenderEffect(() => {
      this.visibleItems();
      const key = this.pendingFocus;
      if (key === null) return;
      this.pendingFocus = null;
      this.native.querySelector<HTMLElement>(`article[data-key="${CSS.escape(key)}"]`)?.focus();
    });

    /**
     * `growing="scroll"` asks when the end of the loaded list enters the
     * scrollport. Only where the observer exists.
     */
    effect((onCleanup) => {
      const more = this.moreElement()?.nativeElement;
      if (this.growingValue() !== 'scroll' || more === undefined || this.loading()) return;
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.loadMoreRequest.emit(createRequest('scroll', undefined));
        }
      });
      observer.observe(more);
      onCleanup(() => observer.disconnect());
    });
  }

  /** Whether the reader is reading: focus in the feed, or the feed's scroller past its start. */
  private reading(): boolean {
    const feed = this.feedElement()?.nativeElement;
    if (feed === undefined) return false;
    const active = feed.ownerDocument.activeElement;
    if (active !== null && feed.contains(active)) return true;
    let node = feed.parentElement;
    while (node !== null) {
      if (node.scrollTop > 0) return true;
      node = node.parentElement;
    }
    return false;
  }

  protected pressReason(event: Event): NotificationCenterPressReason {
    return pressReason(event);
  }

  protected contextOf(item: NotificationItem, position: number): NotificationItemContext {
    const escaped = escapeKey(item.key);
    return {
      $implicit: item,
      ids: { description: `${this.id}-${escaped}-d`, title: `${this.id}-${escaped}-t` },
      position,
      time: formatTimestamp(item.time, {
        format: this.timeFormatValue(),
        locale: this.localeValue(),
        now: this.now(),
        timeZone: this.timeZoneValue(),
      }),
      tone: item.tone ?? 'accent',
    };
  }

  protected positionOf(group: Group, index: number): number {
    let before = 0;
    for (const candidate of this.groups()) {
      if (candidate === group) break;
      before += candidate.items.length;
    }
    return before + index + 1;
  }

  /** Asks to move the view, carrying the reason and the originating event. */
  selectView(next: string, reason: NotificationCenterViewReason, source?: Event) {
    if (next === this.currentView()) return;
    let cancelled = false;
    const state = createControllable<string | undefined>({
      initial: this.currentView(),
      onRequest: (request) => {
        this.viewRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, reason, source);
    if (cancelled || !moved) return;
    this.view.set(next);
  }

  protected forwardView(request: ChangeRequest<string | undefined>) {
    if (request.value === undefined) return;
    this.selectView(
      request.value,
      request.reason as NotificationCenterViewReason,
      request.source as Event | undefined,
    );
  }

  /** Asks to mark these keys read or unread. */
  requestRead(
    keys: readonly string[],
    read: boolean,
    reason: NotificationCenterReadReason,
    event?: Event,
  ) {
    if (keys.length === 0) return;
    this.readRequest.emit(Object.assign(createRequest(reason, event), { keys, read }));
  }

  protected markAll(event: Event) {
    this.requestRead(this.unreadShownKeys(), true, pressReason(event), event);
  }

  /** Asks to mark every unread shown item read, with the reason `programmatic`. */
  markAllRead() {
    this.requestRead(this.unreadShownKeys(), true, 'programmatic');
  }

  private unreadShownKeys(): string[] {
    return this.shownItems()
      .filter((item) => !item.read)
      .map((item) => item.key);
  }

  protected remove(key: string, reason: NotificationCenterPressReason, event?: Event): boolean {
    const request = Object.assign(createRequest(reason, event), { key });
    this.removeRequest.emit(request);
    return !request.cancelled;
  }

  protected open(key: string, event: Event) {
    const request = Object.assign(createRequest(pressReason(event), event), { key });
    this.openRequest.emit(request);
    if (request.cancelled) event.preventDefault();
  }

  /** Shows the held arrivals; a keyboard press moves focus to the first of them. */
  reveal(reason: NotificationCenterReadReason = 'programmatic', event?: Event) {
    const held = this.held();
    if (held.length === 0) return;
    const request = Object.assign(createRequest(reason, event), { count: held.length });
    this.revealRequest.emit(request);
    if (request.cancelled) return;
    if (reason === 'keyboard') this.pendingFocus = held[0] ?? null;
    this.shown.set(new Set([...this.shown(), ...held]));
    this.held.set([]);
  }

  protected loadMore(event: Event) {
    this.loadMoreRequest.emit(createRequest(pressReason(event), event));
  }

  /** Moves focus to the first article, or to `fresh` when arrivals are held. */
  focus() {
    (this.freshElement()?.nativeElement ?? this.articles()[0])?.focus();
  }

  private articles(): HTMLElement[] {
    const feed = this.feedElement()?.nativeElement;
    return feed === undefined
      ? []
      : [...feed.querySelectorAll<HTMLElement>('article[data-part="item"]')];
  }

  protected onFeedKeydown(raw: Event) {
    const event = raw as KeyboardEvent;
    if (event.defaultPrevented) return;
    const feed = this.feedElement()?.nativeElement;
    if (feed === undefined) return;
    const all = this.articles();
    const from = all.findIndex((article) => article.contains(event.target as Node));
    if (from === -1) return;

    if (event.key === 'Delete' && event.target === all[from] && !event.repeat) {
      const article = all[from] as HTMLElement;
      if (!this.remove(article.dataset['key'] ?? '', 'keyboard', event)) return;
      event.preventDefault();
      const next = all[from + 1] ?? all[from - 1];
      if (next !== undefined) {
        next.focus();
      } else {
        (this.freshElement()?.nativeElement ?? tabbables(this.native)[0])?.focus();
      }
      return;
    }

    const target = feedFocusTarget({
      count: all.length,
      ctrlKey: event.ctrlKey,
      from,
      key: event.key,
      metaKey: event.metaKey,
    });
    if (target === null) return;
    const fresh = this.freshElement()?.nativeElement;
    if (target === from && event.key === 'PageUp' && fresh !== undefined) {
      event.preventDefault();
      fresh.focus();
      return;
    }
    event.preventDefault();
    if (typeof target === 'number') {
      all[target]?.focus();
      return;
    }
    const page = tabbables(feed.ownerDocument.body);
    const outside =
      target === 'after'
        ? page.find(
            (candidate) =>
              feed.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING &&
              !feed.contains(candidate),
          )
        : [...page]
            .reverse()
            .find(
              (candidate) =>
                feed.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_PRECEDING &&
                !feed.contains(candidate),
            );
    outside?.focus();
  }
}

/** The consumer's own controls in the header, after mark-all: a preferences link, a menu. */
@Directive({
  selector: '[slNotificationCenterActions]',
  standalone: true,
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlNotificationCenterActions {}

/** The consumer's link from the popover to the page. */
@Directive({
  selector: '[slNotificationCenterFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlNotificationCenterFooter {}

/** The empty page: a result-state, projected in place of the family's words. */
@Directive({ selector: '[slNotificationCenterEmpty]', standalone: true })
export class SlNotificationCenterEmpty {}
