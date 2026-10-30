import {
  afterNextRender,
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
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { createControllable } from '@slotted/core/state';
import {
  advanceStream,
  initialStream,
  prefersReducedMotion,
  settleStream,
} from '@slotted/core/text-stream';
import type { ChangeRequest } from '@slotted/core/state';

import { injectMessageWords, SlMessage } from './message';
import { injectMessageDefaults, reasonOf } from './message-defaults';
import type { BubbleTone, BubbleVariant, MessageChangeReason } from './message-defaults';

let nextId = 0;

/**
 * The surface a message's words are painted on, on the `div` the page wrote.
 *
 * **Painting.** `variant` × `tone`. A bubble that states neither takes it from
 * its row — the reader's own message is the accent's fill, a thread paints no
 * box — then from the token; the result is written as `data-variant` and
 * `data-tone`.
 *
 * **Clamp.** With `maxLines`, a longer text shows its first lines and a
 * “show more” control under the surface, drawn only while the text
 * overflows; the whole text stays in the DOM. `[(revealed)]` is two-way and
 * every move is asked first through `revealedChangeRequest`.
 */
@Component({
  selector: '[slBubble]',
  standalone: true,
  exportAs: 'slBubble',
  imports: [SlGlyph, SlIcon],
  template: `<ng-content></ng-content>
    @if (clamped() && (overflowing() || revealed())) {
      <button
        type="button"
        data-part="more"
        data-part-more=""
        [attr.aria-controls]="contentId"
        [attr.aria-expanded]="revealed()"
        (click)="toggle($event)"
      >
        {{ revealed() ? t('less') : t('more') }}
        <span slIcon><svg slGlyph name="chevron-down"></svg></span>
      </button>
    }`,
  styleUrl: '../../../styles/src/message/message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'message',
    'data-ui-message': '',
    'data-part': 'bubble',
    'data-part-bubble': '',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-clamped]': "clamped() ? '' : null",
    '[attr.data-revealed]': "clamped() && revealed() ? '' : null",
    '[style.--slotted-message-max-lines]': 'maxLines() ?? null',
  },
})
export class SlBubble {
  readonly variant = input<BubbleVariant | undefined>(undefined);
  readonly tone = input<BubbleTone | undefined>(undefined);
  /** Lines shown before the text is clamped behind a “show more” control. */
  readonly maxLines = input<number | undefined>(undefined);
  /** The text shown whole. Two-way; every move is asked first. */
  readonly revealed = model(false);
  readonly revealedChangeRequest = output<ChangeRequest<boolean>>();

  private readonly defaults = injectMessageDefaults();
  private readonly row = inject(SlMessage, { optional: true });

  readonly contentId = `sl-bubble-${nextId++}-content`;
  /** The family's words: the row's, or the language in force outside a row. */
  readonly t = injectMessageWords();
  readonly overflowing = signal(false);
  readonly clamped = computed(() => this.maxLines() !== undefined);

  readonly resolvedVariant = computed<BubbleVariant>(() => {
    const own = this.variant();
    if (own !== undefined) return own;
    if (this.row?.resolvedLayout() === 'thread') return 'plain';
    if (this.row?.align() === 'end') return 'solid';
    return this.defaults.variant;
  });
  readonly resolvedTone = computed<BubbleTone>(() => {
    const own = this.tone();
    if (own !== undefined) return own;
    if (this.row?.align() === 'end' && this.row.resolvedLayout() !== 'thread') return 'accent';
    return this.defaults.tone;
  });

  protected toggle(event: MouseEvent) {
    this.requestRevealed(!this.revealed(), reasonOf(event), event);
  }

  requestRevealed(next: boolean, reason: MessageChangeReason, source: Event) {
    const state = createControllable<boolean>({
      initial: this.revealed(),
      onRequest: (request) => this.revealedChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.revealed.set(next);
  }
}

/**
 * The painted surface, on the `div`, `button` or `a` the page wrote: a quick
 * reply is a `button`, a way out of the thread an `a`, and each keeps the
 * painting, the hover, the press and the focus ring. Inside a clamped bubble
 * it measures whether its text overflows, which is what draws “show more”.
 */
@Directive({
  selector: '[slBubbleContent]',
  standalone: true,
  host: { 'data-part': 'content', 'data-part-content': '', '[attr.id]': 'id' },
})
export class SlBubbleContent {
  private readonly bubble = inject(SlBubble, { optional: true });
  protected readonly id =
    inject(new HostAttributeToken('id'), { optional: true }) ?? this.bubble?.contentId ?? null;

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const bubble = this.bubble;
    if (bubble === null) return;
    let observer: ResizeObserver | null = null;
    afterNextRender(() => {
      const measure = () => {
        if (!bubble.clamped() || bubble.revealed()) return;
        bubble.overflowing.set(element.scrollHeight > element.clientHeight + 1);
      };
      measure();
      if (typeof ResizeObserver === 'undefined') return;
      observer = new ResizeObserver(measure);
      observer.observe(element);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}

/**
 * The message a reply answers, at the head of the surface, on the `div` or
 * `button` the page wrote. On a `button` it asks the page to scroll to the
 * quoted message through `(click)` — the scroller's `scrollToMessage`.
 */
@Component({
  selector: '[slBubbleQuote]',
  standalone: true,
  template: `@if (author(); as name) {
      <span data-part="quote-author" data-part-quote-author="">{{ name }}</span>
    }
    <ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'quote', 'data-part-quote': '' },
})
export class SlBubbleQuote {
  readonly author = input<string | undefined>(undefined);
}

/**
 * The words of a streamed reply, entering as they arrive, on the `span` the
 * page wrote.
 *
 * `text` is everything received so far. What extends the previous text is
 * split into words by `@slotted/core/text-stream`; each word is in the DOM at
 * once and enters as a `stream-chunk` after a delay of at most 320 ms, so a
 * burst from the transport reads as a wave rather than a block. A chunk that
 * has entered is folded back into plain text. Text that does not extend the
 * previous — a regenerated reply — replaces it at once, and so does every
 * arrival under reduced motion.
 *
 * Arrivals animate while the row is `streaming`, and the arrival that ends
 * the stream with it; `animate` states it outright.
 */
@Component({
  selector: 'span[slBubbleStream]',
  standalone: true,
  /* One line: a space or a line break between the text and the chunks would be painted. */
  // prettier-ignore
  template: `{{ stream().settled }}@for (chunk of stream().chunks; track chunk.key) {<span data-part="stream-chunk" data-part-stream-chunk="" [style.animation-delay.ms]="chunk.delay" (animationend)="settle(chunk.key)">{{ chunk.text }}</span>}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'stream', 'data-part-stream': '' },
})
export class SlBubbleStream {
  private readonly row = inject(SlMessage, { optional: true });
  private readonly view = inject(ElementRef<HTMLElement>).nativeElement.ownerDocument.defaultView;

  /** The whole reply received so far. Text that extends it enters word by word. */
  readonly text = input.required<string>();
  /** Let arrivals enter. Falls back to whether the row is `streaming`. */
  readonly animate = input<boolean | undefined>(undefined);

  private readonly streaming = computed(() => this.animate() ?? this.row?.status() === 'streaming');
  protected readonly stream = signal(initialStream(''));
  private started = false;
  private wasStreaming = false;

  constructor() {
    effect(() => {
      const text = this.text();
      const streaming = this.streaming();
      untracked(() => {
        if (!this.started) {
          this.started = true;
          this.stream.set(initialStream(text));
        } else {
          this.stream.update((stream) =>
            advanceStream(stream, text, {
              animate: (streaming || this.wasStreaming) && !prefersReducedMotion(this.view),
              now: typeof performance === 'undefined' ? 0 : performance.now(),
            }),
          );
        }
        this.wasStreaming = streaming;
      });
    });
  }

  protected settle(key: number) {
    this.stream.update((stream) => settleStream(stream, key));
  }
}

/** The caret at the end of the words that have arrived while a reply streams. */
@Directive({
  selector: '[slBubbleCaret]',
  standalone: true,
  host: { 'data-part': 'caret', 'data-part-caret': '', 'aria-hidden': 'true' },
})
export class SlBubbleCaret {}

/** Three dots in the bubble of someone writing, named for assistive technology. */
@Component({
  selector: '[slBubbleTyping]',
  standalone: true,
  template: '<span></span><span></span><span></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'typing',
    'data-part-typing': '',
    role: 'img',
    '[attr.aria-label]': 'label()',
  },
})
export class SlBubbleTyping {
  private readonly t = injectMessageWords();
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  /** A written `aria-label` wins over the `typing` message. */
  protected readonly label = computed(() => this.written ?? this.t('typing'));
}

/**
 * The round control beside a message that did not go, on the `button` the
 * page wrote. It asks the row's `(retry)` with the reason, after the page's
 * own `(click)`.
 */
@Component({
  selector: 'button[slBubbleRetry]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: '<span slIcon><svg slGlyph name="rotate-ccw"></svg></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'retry',
    'data-part-retry': '',
    type: 'button',
    '[attr.aria-label]': 'label()',
    '(click)': 'onClick($event)',
  },
})
export class SlBubbleRetry {
  private readonly row = inject(SlMessage, { optional: true });
  private readonly t = injectMessageWords();
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly label = computed(() => this.written ?? this.t('retry'));

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    this.row?.requestRetry(reasonOf(event), event);
  }
}

/** The row of reactions straddling the surface's lower edge; in a thread, a row under the words. */
@Directive({
  selector: '[slBubbleReactions]',
  standalone: true,
  host: {
    'data-part': 'reactions',
    'data-part-reactions': '',
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
})
export class SlBubbleReactions {
  private readonly t = injectMessageWords();
  private readonly written = inject(new HostAttributeToken('aria-label'), { optional: true });
  protected readonly label = computed(() => this.written ?? this.t('reactions'));
}

/**
 * One reaction on the `button` the page wrote: the emoji or mark the page
 * writes inside it, and its count. `[(pressed)]` is two-way and every move is
 * asked first through `pressedChangeRequest`; the count is the page's store's.
 */
@Component({
  selector: 'button[slBubbleReaction]',
  standalone: true,
  template: `<ng-content></ng-content>
    @if (count() !== undefined) {
      <span data-part="reaction-count" data-part-reaction-count="">{{ count() }}</span>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'reaction',
    'data-part-reaction': '',
    type: 'button',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.data-pressed]': "pressed() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[disabled]': 'disabled()',
    '(click)': 'toggle($event)',
  },
})
export class SlBubbleReaction {
  readonly pressed = model(false);
  readonly count = input<number | undefined>(undefined);
  readonly disabled = input(false);
  readonly pressedChangeRequest = output<ChangeRequest<boolean>>();

  protected toggle(event: MouseEvent) {
    if (event.defaultPrevented || this.disabled()) return;
    const state = createControllable<boolean>({
      initial: this.pressed(),
      onRequest: (request) => this.pressedChangeRequest.emit(request),
    });
    if (state.request(!this.pressed(), reasonOf(event), event)) this.pressed.set(!this.pressed());
  }
}
