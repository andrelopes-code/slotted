import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlLoader } from '@slotted/angular/progress-indicator';
import type { GlyphName } from '@slotted/angular/icon';
import { createRemovalFocus } from '@slotted/core/focus';
import { type PartialMessages, toastMessages, type ToastMessages } from '@slotted/core/i18n';
import { createPortalRoot } from '@slotted/core/portal';
import { createPresence } from '@slotted/core/presence';
import { createToastStore } from '@slotted/core/toast';
import type { ChangeRequest } from '@slotted/core/state';
import type { ToastMessage, ToastStore } from '@slotted/core/toast';

import { injectToastDefaults, SlToastService } from './toast-defaults';
import type {
  ToastAttach,
  ToastContent,
  ToastPlacement,
  ToastStacking,
  ToastTone,
} from './toast-defaults';

/**
 * The glyph each tone draws: `specs/components/toast/contract.json` holds the
 * map, and the binding draws it because a stylesheet paints no icon.
 */
const TONE_GLYPH: Record<ToastTone, GlyphName | null> = {
  accent: 'status-info',
  secondary: null,
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/** Which way a message is dragged away, given the edge its region sits at. */
function swipeAxis(placement: ToastPlacement, direction: string) {
  const block = placement.startsWith('top') ? -1 : 1;
  const rtl = direction === 'rtl';
  const inline = placement.endsWith('-start')
    ? rtl
      ? 1
      : -1
    : placement.endsWith('-end')
      ? rtl
        ? -1
        : 1
      : 0;
  return { block, inline };
}

/**
 * A message's own height, which is not the height it is drawn at: a closed
 * pile draws every message at the front one's height, and an opening one
 * animates it. The override is lifted for the one read, and not at all while
 * the height is moving, because lifting it then cancels the movement — the
 * last measurement stands until the transition ends and the observer fires
 * again. Chrome names the logical property's transition by its physical one.
 */
function naturalHeight(item: HTMLElement): number {
  const moving =
    typeof item.getAnimations === 'function' &&
    item
      .getAnimations()
      .some((animation) =>
        ['block-size', 'height', 'width'].includes(
          (animation as Animation & { transitionProperty?: string }).transitionProperty ?? '',
        ),
      );
  if (moving) {
    const last = Number.parseFloat(item.style.getPropertyValue('--slotted-toast-height'));
    if (!Number.isNaN(last)) return last;
  }
  const inline = item.style.blockSize;
  item.style.blockSize = 'auto';
  const height = item.getBoundingClientRect().height;
  item.style.blockSize = inline;
  return height;
}

/**
 * One message: everything about it that is behaviour rather than markup.
 *
 * It is a directive rather than a component so a page that writes its own list
 * — from `SlToastService.visible()` and nothing else — gets the timer, the
 * exit, the swipe and the keyboard by putting one attribute on its own `li`.
 */
@Directive({
  selector: 'li[slToastItem]',
  standalone: true,
  exportAs: 'slToastItem',
  host: {
    'data-part': 'item',
    'data-part-item': '',
    tabindex: '-1',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-open]': "isOpen() ? '' : null",
    '[attr.data-loading]': "message().loading ? '' : null",
    '[attr.data-dragging]': "dragging() ? '' : null",
    '[style.--slotted-toast-index]': 'index()',
    '[style.--slotted-toast-duration]': 'durationValue()',
    '[style.--slotted-toast-swipe-x]': 'swipeX()',
    '[style.--slotted-toast-swipe-y]': 'swipeY()',
    '(keydown)': 'onKeyDown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class SlToastItem {
  readonly message = input.required<ToastMessage<ToastContent>>({ alias: 'slToastItem' });
  /** How far this message is from the front of the pile. The stylesheet reads it. */
  readonly index = input(0, { alias: 'slToastItemIndex' });

  private readonly region = inject(SlToastRegion);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /**
   * The message's own injector, handed to a page's body template so the parts
   * inside it — the mark's glyph above all — read this message and not the
   * place the template was declared.
   */
  readonly injector = inject(Injector);

  private readonly status = signal<'entering' | 'open' | 'exiting' | 'unmounted'>('entering');
  protected readonly dragging = signal(false);
  private readonly offset = signal<{ x: number; y: number } | null>(null);
  private drag: { id: number; x: number; y: number } | null = null;

  readonly tone = computed(() => this.message().data.tone ?? this.region.defaults.tone);
  /**
   * The glyph the tone's mark draws: none while a promise is in flight, when
   * the mark is `progress-indicator`'s contained loader, and none for
   * `secondary`, a neutral message with no severity to state.
   */
  readonly mark = computed<GlyphName | null>(() =>
    this.message().loading ? null : TONE_GLYPH[this.tone()],
  );
  protected readonly variant = computed(
    () => this.message().data.variant ?? this.region.defaults.variant,
  );
  protected readonly isOpen = computed(() => this.status() === 'open');
  protected readonly durationValue = computed(() => {
    const duration = this.message().duration;
    return duration > 0 ? `${duration}ms` : null;
  });
  protected readonly swipeX = computed(() => {
    const value = this.offset();
    return value === null ? null : `${value.x}px`;
  });
  protected readonly swipeY = computed(() => {
    const value = this.offset();
    return value === null ? null : `${value.y}px`;
  });

  /**
   * `packages/core/src/presence` reads the exit the stylesheet declares and
   * completes it on a timer when the browser never reports one — a backgrounded
   * tab, a `display: none` ancestor. Ark guesses two hundred milliseconds
   * instead, and a message caught by any of those cases never leaves.
   */
  private readonly presence = createPresence({
    initialPresent: true,
    skipInitialAnimation: false,
    onStatusChange: (next) => this.status.set(next),
    onExitComplete: () => this.region.store.remove(this.message().id),
  });

  constructor() {
    this.presence.setNode(this.host.nativeElement);
    effect(() => {
      this.presence.request(this.message().status !== 'closing', 'programmatic');
    });
    inject(DestroyRef).onDestroy(() => this.presence.destroy());
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key !== 'Escape') return;
    /* Only the message the keyboard is in: a page whose dialog is open keeps
       its own Escape. */
    event.stopPropagation();
    this.region.store.dismiss(this.message().id, 'escape');
  }

  protected onPointerDown(event: PointerEvent) {
    if (!this.region.resolvedSwipe() || event.button !== 0) return;
    /* A control inside the message is what the pointer came for. */
    if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    this.host.nativeElement.setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent) {
    const start = this.drag;
    if (!start || start.id !== event.pointerId) return;

    const element = this.host.nativeElement;
    const view = element.ownerDocument.defaultView;
    const axis = swipeAxis(
      this.region.resolvedPlacement(),
      view?.getComputedStyle(element).direction ?? 'ltr',
    );
    /* Only movement toward the edge the region sits at counts. Dragging a
       message into the page is not a gesture, it is a slip. */
    const x = axis.inline === 0 ? 0 : Math.max(0, (event.clientX - start.x) * axis.inline);
    const y = Math.max(0, (event.clientY - start.y) * axis.block);
    if (!this.dragging() && Math.max(x, y) < 2) return;

    this.dragging.set(true);
    this.offset.set({ x: x * axis.inline, y: y * axis.block });
  }

  protected onPointerUp(event: PointerEvent) {
    if (!this.drag || this.drag.id !== event.pointerId) return;
    const moved = this.offset();
    const distance = moved === null ? 0 : Math.max(Math.abs(moved.x), Math.abs(moved.y));

    this.drag = null;
    this.dragging.set(false);
    this.offset.set(null);
    const element = this.host.nativeElement;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);

    /* Past the threshold the gesture was a dismissal; short of it the message
       springs back, which is the only way a reader can change their mind. */
    if (event.type !== 'pointercancel' && distance >= this.region.defaults.swipeThreshold) {
      this.region.store.dismiss(this.message().id, 'pointer');
    }
  }
}

/**
 * The place transient messages appear, and the only part of this family a page
 * renders directly.
 *
 * **It is a landmark, not a live region.** A live role on a box holding a Close
 * and an Undo is read with both buttons inside the sentence, and a region
 * created in the same task as its text is silent under ARIA 1.2 §6.4. The words
 * are spoken by `packages/core/src/live-announcer`; this element is what a
 * reader navigates to, with the hotkey or with their own landmark list.
 *
 * **It never takes focus.** The APG's Alert pattern is explicit that an
 * arriving message must not affect the keyboard, and the whole of this family's
 * claim on it is one key the reader presses.
 */
@Component({
  selector: 'sl-toast-region',
  standalone: true,
  exportAs: 'slToastRegion',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlLoader, SlToastItem],
  template: `<section
    #layer
    data-part="root"
    data-part-root=""
    data-ui="toast"
    data-ui-toast=""
    role="region"
    tabindex="-1"
    [attr.aria-label]="t('label')"
    [attr.data-attach]="resolvedAttach()"
    [attr.data-expanded]="paused() ? '' : null"
    [attr.data-placement]="resolvedPlacement()"
    [attr.data-stacking]="resolvedStacking()"
    [attr.data-swipe]="resolvedSwipe()"
    [style.--slotted-toast-count]="visible().length"
    [style.--slotted-toast-play-state]="paused() ? 'paused' : 'running'"
    (focusin)="onFocus(true)"
    (focusout)="onFocusOut($event)"
    (pointerenter)="onPointer(true)"
    (pointerleave)="onPointer(false)"
  >
    <ol data-part="list" data-part-list="">
      @for (message of visible(); track message.id; let index = $index) {
        <li [slToastItem]="message" [slToastItemIndex]="index" #item="slToastItem">
          @if (message.data.body; as body) {
            <ng-container
              [ngTemplateOutlet]="body"
              [ngTemplateOutletContext]="{ $implicit: message }"
              [ngTemplateOutletInjector]="item.injector"
            />
          } @else {
            @if (!message.data.hideIcon && (message.loading || item.mark())) {
              <span aria-hidden="true" data-part="icon" data-part-icon="">
                @if (message.loading) {
                  <div
                    slLoader
                    contained
                    decorative
                    [delay]="0"
                    [minDuration]="0"
                    [tone]="item.tone()"
                  ></div>
                } @else if (item.mark(); as glyph) {
                  <span slIcon><svg slGlyph [name]="glyph" solid></svg></span>
                }
              </span>
            }
            <div data-part="content" data-part-content="">
              @if (message.data.title) {
                <div data-part="title" data-part-title="">{{ message.data.title }}</div>
              }
              @if (message.data.description) {
                <p data-part="description" data-part-description="">
                  {{ message.data.description }}
                </p>
              }
            </div>
            @if (message.data.dismissible ?? defaults.dismissible) {
              <button
                type="button"
                data-part="close"
                data-part-close=""
                [attr.aria-label]="t('close')"
                (click)="store.dismiss(message.id, 'dismiss')"
              >
                <span slIcon><svg slGlyph name="x"></svg></span>
              </button>
            }
            @if (message.data.actions; as actions) {
              <div data-part="actions" data-part-actions="">
                <ng-container
                  [ngTemplateOutlet]="actions"
                  [ngTemplateOutletContext]="{ $implicit: message }"
                />
              </div>
            }
            @if ((message.data.progress ?? defaults.progress) && message.duration > 0) {
              <div aria-hidden="true" data-part="progress" data-part-progress=""></div>
            }
          }
        </li>
      }
    </ol>
  </section>`,
  styleUrl: '../../../styles/src/toast/toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class SlToastRegion {
  /** Defaults to the token, then to `bottom-end`. */
  readonly placement = input<ToastPlacement | undefined>(undefined);
  /** Defaults to the token, then to `portal`. */
  readonly attach = input<ToastAttach | undefined>(undefined);
  /** Defaults to the token, then to `list`. */
  readonly stacking = input<ToastStacking | undefined>(undefined);
  readonly swipe = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly limit = input<number | undefined>(undefined);
  readonly duration = input<number | undefined>(undefined);
  readonly pauseOnHover = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly pauseWhenHidden = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** The key that moves focus into the region. Defaults to the token. */
  readonly hotkey = input<string | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the name
   * a reader finds the region by (`label`) and what each close control
   * announces (`close`).
   */
  readonly messages = input<PartialMessages<ToastMessages> | undefined>(undefined);
  /** The element a portalled region is placed inside. */
  readonly container = input<Element | null | undefined>(undefined);
  /** The queue the page owns. Present at all decides the mode for good. */
  readonly toasts = input<readonly ToastMessage<ToastContent>[] | undefined>(undefined);

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(toasts)]`
   * because a two-way binding has one slot and cannot carry any of those — the
   * shape `alert` settled.
   */
  readonly toastsChange = output<ChangeRequest<readonly ToastMessage<ToastContent>[]>>();

  readonly defaults = injectToastDefaults();
  /** The family's words in the language in force, with this region's `messages` laid over them. */
  readonly t = injectMessages(toastMessages, this.messages);
  private readonly service = inject(SlToastService);
  private readonly layer = viewChild.required<ElementRef<HTMLElement>>('layer');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * A region the page's own array feeds cannot share the injected service: the
   * mode is decided once, for the life of the store, and the service's store is
   * uncontrolled by construction.
   */
  private readonly ownStore: ToastStore<ToastContent> | null =
    this.toasts() === undefined
      ? null
      : createToastStore<ToastContent>({ toasts: this.toasts() ?? [] });

  readonly store: ToastStore<ToastContent> = this.ownStore ?? this.service.store;

  private readonly snapshot = signal(this.store.snapshot);

  readonly visible = computed(() => this.snapshot().visible);
  readonly queued = computed(() => this.snapshot().queued);
  readonly paused = computed(() => this.snapshot().paused);

  readonly resolvedPlacement = computed(() => this.placement() ?? this.defaults.placement);
  readonly resolvedAttach = computed(() => this.attach() ?? this.defaults.attach);
  readonly resolvedStacking = computed(() => this.stacking() ?? this.defaults.stacking);
  readonly resolvedSwipe = computed(() => this.swipe() ?? this.defaults.swipe);
  readonly resolvedHotkey = computed(() => this.hotkey() ?? this.defaults.hotkey);

  private readonly interacting = { pointer: false, focus: false };
  /** Where the keyboard was before the hotkey moved it into the region. */
  private cameFrom: HTMLElement | null = null;

  constructor() {
    const stop = this.store.subscribe(() => this.snapshot.set(this.store.snapshot));
    this.store.onRequest((request) => this.toastsChange.emit(request));

    effect(() => {
      this.store.configure({
        limit: this.limit() ?? this.defaults.limit,
        duration: this.duration() ?? this.defaults.duration,
        pauseOnHover: this.pauseOnHover() ?? this.defaults.pauseOnHover,
        pauseWhenHidden: this.pauseWhenHidden() ?? this.defaults.pauseWhenHidden,
      });
    });

    effect(() => {
      const owned = this.toasts();
      if (owned !== undefined) this.store.sync(owned);
    });

    /**
     * A portalled region inherits nothing from where it was written, so the
     * layer carries the theme, the scheme, the density and the direction of the
     * host it came from. Every surveyed implementation loses them.
     *
     * Only in the browser, as the focus effects below: the server's document is
     * not the page. The region is drawn in its host there, where hydration
     * expects the view's nodes, and nothing on the server holds focus.
     */
    effect((onCleanup) => {
      const section = this.layer().nativeElement;
      if (this.resolvedAttach() !== 'portal' || !this.browser) return;

      const handle = createPortalRoot({
        origin: this.host.nativeElement,
        container: this.container() ?? null,
      });
      handle.container?.append(section);
      onCleanup(() => {
        /* Back where Angular expects it before the layer goes, so the view's
           own teardown removes a node whose parent it still knows. */
        this.host.nativeElement.append(section);
        handle.release();
      });
    });

    /**
     * Where the keyboard goes when the message it was in is taken away — the
     * next message, then the element focus came from. Only React Aria answers
     * it at all, and only for its own close button.
     */
    effect((onCleanup) => {
      const section = this.layer().nativeElement;
      if (!this.browser) return;
      const handle = createRemovalFocus(section, {
        itemSelector: '[data-part="item"]',
        fallback: () => this.cameFrom,
      });
      onCleanup(() => handle.destroy());
    });

    /** The one key this family binds, and the only thing that moves focus here. */
    effect((onCleanup) => {
      const section = this.layer().nativeElement;
      const doc = section.ownerDocument;
      const hotkey = this.resolvedHotkey();
      if (!this.browser) return;

      const onKeyDown = (event: KeyboardEvent) => {
        const parts = hotkey.toLowerCase().split('+');
        const key = parts.at(-1) ?? '';
        const wants = (name: string) => parts.includes(name);
        if (
          event.key.toLowerCase() !== key ||
          event.altKey !== wants('alt') ||
          event.ctrlKey !== wants('ctrl') ||
          event.shiftKey !== wants('shift') ||
          event.metaKey !== wants('meta')
        ) {
          return;
        }

        const first = section.querySelector<HTMLElement>('[data-part="item"]');
        if (!first) return;
        event.preventDefault();
        const active = doc.activeElement;
        this.cameFrom = active instanceof HTMLElement && !section.contains(active) ? active : null;
        first.focus();
      };

      doc.addEventListener('keydown', onKeyDown);
      onCleanup(() => doc.removeEventListener('keydown', onKeyDown));
    });

    /**
     * Measured, and only for the pile. A column of messages that are not all
     * the same height cannot be opened from arithmetic alone.
     *
     * After render rather than as an `effect`: a component's effect runs
     * before its view is refreshed, so the messages that just arrived were not
     * in the list yet and the pile was never measured.
     */
    afterRenderEffect((onCleanup) => {
      const section = this.layer().nativeElement;
      if (this.resolvedStacking() !== 'stack') return;
      void this.visible();

      const list = section.querySelector<HTMLElement>('[data-part="list"]');
      const view = section.ownerDocument.defaultView;
      if (!list || !view || typeof view.ResizeObserver !== 'function') return;

      const measure = () => {
        const items = [...list.querySelectorAll<HTMLElement>('[data-part="item"]')];
        const gap = Number.parseFloat(view.getComputedStyle(list).rowGap) || 0;
        let offset = 0;
        items.forEach((item, index) => {
          const height = naturalHeight(item);
          item.style.setProperty('--slotted-toast-height', `${height}px`);
          item.style.setProperty('--slotted-toast-stack-offset', `${offset}px`);
          if (index === 0) section.style.setProperty('--slotted-toast-front-height', `${height}px`);
          offset += height + gap;
        });
        /* The open pile's whole height, so its gaps are the region's. */
        section.style.setProperty('--slotted-toast-stack-height', `${Math.max(0, offset - gap)}px`);
      };

      const observer = new view.ResizeObserver(measure);
      for (const item of list.querySelectorAll('[data-part="item"]')) observer.observe(item);
      measure();
      onCleanup(() => observer.disconnect());
    });

    inject(DestroyRef).onDestroy(() => {
      stop();
      this.ownStore?.destroy();
    });
  }

  /** Sends the keyboard to the newest message. The family never does it alone. */
  focus() {
    this.layer().nativeElement.querySelector<HTMLElement>('[data-part="item"]')?.focus();
  }

  protected onPointer(inside: boolean) {
    this.interacting.pointer = inside;
    this.report();
  }

  protected onFocus(inside: boolean) {
    this.interacting.focus = inside;
    this.report();
  }

  protected onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.layer().nativeElement.contains(next)) return;
    this.interacting.focus = false;
    this.report();
  }

  private report() {
    this.store.setInteracting(this.interacting.pointer || this.interacting.focus);
  }
}
