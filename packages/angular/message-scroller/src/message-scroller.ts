import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  messageScrollerMessages,
  type MessageScrollerMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createMessageScroller } from '@slotted/core/message-scroller';
import type {
  MessageScrollerEdges,
  MessageScrollerPosition,
  MessageScrollerState,
  ScrollCommandOptions,
  ScrollToMessageOptions,
} from '@slotted/core/message-scroller';

import { injectMessageScrollerDefaults } from './message-scroller-defaults';

/**
 * The region a conversation scrolls in, on the `div` the page wrote. It fills
 * a parent whose height is bounded; the viewport inside it scrolls and the
 * jump control stands over it.
 *
 * The behavior is `@slotted/core/message-scroller`: where a saved
 * conversation opens, whether new words pull the view (`follow`), where a
 * turn the reader sends stands (`anchor` on the item), older rows arriving
 * above without moving the reader, and jumps — `scrollToMessage()` on the
 * instance (`#chat="slMessageScroller"`). The engine writes the scroll state
 * on the DOM itself; the instance's `state` signal is what the jump control
 * reads.
 */
@Component({
  selector: '[slMessageScroller]',
  standalone: true,
  exportAs: 'slMessageScroller',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/message-scroller/message-scroller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'message-scroller',
    'data-ui-message-scroller': '',
    'data-part': 'root',
    'data-part-root': '',
  },
})
export class SlMessageScroller {
  readonly follow = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultPosition = input<MessageScrollerPosition | undefined>(undefined);
  readonly edgeThreshold = input<number | undefined>(undefined);
  readonly scrollMargin = input<number | undefined>(undefined);
  readonly peek = input<number | undefined>(undefined);
  readonly preserveOnPrepend = input<boolean | undefined>(undefined);
  /** A reply is streaming: the log is `aria-busy` and the change is announced once each way. */
  readonly busy = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * region's name, the jump controls, the unread line, the loader and the
   * two announcements of a streaming reply.
   */
  readonly messages = input<PartialMessages<MessageScrollerMessages> | undefined>(undefined);

  /** The reader reached the top — the moment to ask for older messages. */
  readonly reachStart = output<'scroll'>();
  readonly anchorChange = output<{ id: string | null; reason: 'scroll' | 'programmatic' }>();
  readonly scrollableChange = output<MessageScrollerEdges>();

  private readonly defaults = injectMessageScrollerDefaults();
  /** The family's words in the language in force, with this scroller's `messages` laid over them. */
  readonly t = injectMessages(messageScrollerMessages, this.messages);
  readonly resolvedPosition = computed(
    () => this.defaultPosition() ?? this.defaults.defaultPosition,
  );

  private readonly engine = createMessageScroller({
    defaultPosition: this.defaults.defaultPosition,
    onAnchorChange: (id, reason) => this.anchorChange.emit({ id, reason }),
    onReachStart: (reason) => this.reachStart.emit(reason),
    onScrollableChange: (edges) => this.scrollableChange.emit(edges),
  });

  /** The engine's state: which edges the viewport can scroll toward, the count of rows out of view. */
  readonly state = signal<MessageScrollerState>(this.engine.getState());

  private readonly root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private viewport: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private disconnect: (() => void) | null = null;

  constructor() {
    const unsubscribe = this.engine.subscribe(() => this.state.set(this.engine.getState()));
    effect(() => {
      this.engine.update({
        defaultPosition: this.resolvedPosition(),
        edgeThreshold: this.edgeThreshold(),
        follow: this.follow() ?? this.defaults.follow,
        peek: this.peek() ?? this.defaults.peek,
        preserveOnPrepend: this.preserveOnPrepend(),
        scrollMargin: this.scrollMargin() ?? this.defaults.scrollMargin,
      });
    });
    let wasBusy: boolean | null = null;
    effect(() => {
      const busy = this.busy();
      if (wasBusy !== null && wasBusy !== busy) {
        getLiveAnnouncer().announce(untracked(() => (busy ? this.t('busy') : this.t('idle'))));
      }
      wasBusy = busy;
    });
    inject(DestroyRef).onDestroy(() => {
      unsubscribe();
      this.disconnect?.();
      this.engine.destroy();
    });
  }

  /** @internal */ registerViewport(node: HTMLElement) {
    this.viewport = node;
    this.connect();
  }

  /** @internal */ registerContent(node: HTMLElement) {
    this.content = node;
    this.connect();
  }

  private connect() {
    if (this.viewport === null || this.content === null) return;
    this.disconnect?.();
    this.disconnect = this.engine.connect({
      content: this.content,
      root: this.root,
      viewport: this.viewport,
    });
    this.state.set(this.engine.getState());
  }

  scrollToMessage(id: string, options?: ScrollToMessageOptions): boolean {
    return this.engine.scrollToMessage(id, options);
  }

  scrollToEnd(options?: ScrollCommandOptions): boolean {
    return this.engine.scrollToEnd(options);
  }

  scrollToStart(options?: ScrollCommandOptions): boolean {
    return this.engine.scrollToStart(options);
  }

  /** Moves focus to the viewport, which scrolls from the keyboard. */
  focus() {
    this.viewport?.focus();
  }
}

function scroller(): SlMessageScroller {
  const owner = inject(SlMessageScroller, { optional: true });
  if (owner === null)
    throw new Error('A message-scroller part is rendered outside slMessageScroller.');
  return owner;
}

/**
 * The element that scrolls: a labelled region that takes focus, so the
 * keyboard scrolls it; hidden, laid out, until the opening position applies.
 */
@Directive({
  selector: '[slMessageScrollerViewport]',
  standalone: true,
  host: {
    'data-part': 'viewport',
    'data-part-viewport': '',
    role: 'region',
    '[attr.tabindex]': 'tabindex',
    '[attr.aria-label]': 'label()',
  },
})
export class SlMessageScrollerViewport {
  private readonly owner = scroller();
  protected readonly tabindex =
    inject(new HostAttributeToken('tabindex'), { optional: true }) ?? '0';
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly label = computed(() => this.written ?? this.owner.t('label'));

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (this.owner.resolvedPosition() !== 'start') host.setAttribute('data-pending', '');
    afterNextRender(() => this.owner.registerViewport(host));
  }
}

/** The rows: a WAI-ARIA `log`; `busy` on the scroller holds arrivals back until a reply is whole. */
@Directive({
  selector: '[slMessageScrollerContent]',
  standalone: true,
  host: {
    'data-part': 'content',
    'data-part-content': '',
    role: 'log',
    'aria-relevant': 'additions',
    '[attr.aria-busy]': "owner.busy() ? 'true' : null",
  },
})
export class SlMessageScrollerContent {
  protected readonly owner = scroller();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => this.owner.registerContent(host));
  }
}

/** One row — a message, a separator, a line the system writes. */
@Directive({
  selector: '[slMessageScrollerItem]',
  standalone: true,
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.data-message-id]': 'messageId() ?? null',
    '[attr.data-anchor]': "anchor() ? 'true' : null",
  },
})
export class SlMessageScrollerItem {
  readonly messageId = input<string | undefined>(undefined);
  readonly anchor = input(false, { transform: booleanAttribute });
}

/** A day, or a line the system writes; `sticky` keeps it at the top while its rows are in view. */
@Component({
  selector: '[slMessageScrollerSeparator]',
  standalone: true,
  template: '<span><ng-content></ng-content></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'separator',
    'data-part-separator': '',
    '[attr.data-sticky]': "sticky() ? '' : null",
  },
})
export class SlMessageScrollerSeparator {
  readonly sticky = input(false, { transform: booleanAttribute });
}

/** The line above the first message the reader has not seen. */
@Component({
  selector: '[slMessageScrollerUnread]',
  standalone: true,
  template: `<span
    ><ng-content>{{ owner.t('unread') }}</ng-content></span
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'unread', 'data-part-unread': '' },
})
export class SlMessageScrollerUnread {
  protected readonly owner = scroller();
}

/** Older rows on their way: the shared ring and a line of text, read once as a status. */
@Component({
  selector: '[slMessageScrollerLoader]',
  standalone: true,
  template: `<span aria-hidden="true" data-ui="spinner" data-ui-spinner=""
      ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8.875" />
        <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg></span
    ><span
      ><ng-content>{{ owner.t('loader') }}</ng-content></span
    >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'loader', 'data-part-loader': '', role: 'status' },
})
export class SlMessageScrollerLoader {
  protected readonly owner = scroller();
}

/**
 * The control that takes the reader to the latest row — or, with
 * `direction="start"`, to the first — on the `button` the page wrote. With
 * nowhere to go it is inert and out of the tab order; when rows arrived out
 * of view it says how many, in its name and on its face.
 */
@Component({
  selector: 'button[slMessageScrollerJump]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<span slIcon><svg slGlyph name="arrow-left"></svg></span>
    @if (words(); as count) {
      <span data-part="jump-count" data-part-jump-count="">{{ count }}</span>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'jump',
    'data-part-jump': '',
    type: 'button',
    '[attr.data-direction]': 'direction()',
    '[attr.data-active]': 'active() ? "true" : "false"',
    '[attr.inert]': "active() ? null : ''",
    '[attr.tabindex]': 'active() ? 0 : -1',
    '[attr.aria-label]': 'label()',
    '(click)': 'onClick($event)',
  },
})
export class SlMessageScrollerJump {
  readonly direction = input<'end' | 'start'>('end');
  readonly behavior = input<ScrollBehavior>('smooth');

  private readonly owner = scroller();
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected readonly active = computed(() => {
    const { scrollable } = this.owner.state();
    return this.direction() === 'end' ? scrollable.end : scrollable.start;
  });
  private readonly count = computed(() =>
    this.direction() === 'end' ? this.owner.state().newCount : 0,
  );
  protected readonly words = computed(() => {
    const count = this.count();
    return count > 0 ? this.owner.t('jumpCount', { count }) : null;
  });
  protected readonly label = computed(() => {
    if (this.ownLabel !== null) return this.ownLabel;
    if (this.direction() === 'start') return this.owner.t('jumpToStart');
    const count = this.count();
    return count > 0 ? this.owner.t('jumpToEndCount', { count }) : this.owner.t('jumpToEnd');
  });

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    if (this.direction() === 'end') this.owner.scrollToEnd({ behavior: this.behavior() });
    else this.owner.scrollToStart({ behavior: this.behavior() });
  }
}
