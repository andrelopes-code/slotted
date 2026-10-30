import { createToastStore } from '@slotted/core/toast';
import type {
  ToastMessage,
  ToastPriority,
  ToastReason,
  ToastStatus,
  ToastStore,
} from '@slotted/core/toast';
import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import type { Signal, TemplateRef } from '@angular/core';

/** Which of the five semantic colors the message speaks in. */
export type ToastTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/**
 * How that color is painted. `raised` is the neutral surface with the tone in
 * the mark, and it is the default: a message floats over content this family
 * does not own, and tinting that content's corner is not its decision.
 */
export type ToastVariant = 'raised' | 'soft' | 'solid';

/** Which edge of the screen — or of the panel — the region sits at. */
export type ToastPlacement =
  'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';

/**
 * Where the region is rendered. One axis with three values rather than two
 * booleans that admit a meaningless combination.
 */
export type ToastAttach = 'portal' | 'viewport' | 'inline';

/** Whether the messages stand in a column or in a pile that opens. */
export type ToastStacking = 'list' | 'stack';

export type { ToastMessage, ToastPriority, ToastReason, ToastStatus, ToastStore };

/**
 * What a message carries for rendering. Opaque to `@slotted/core/toast`, which
 * reads four fields out of the call and never looks in here.
 */
export interface ToastContent {
  title?: string;
  description?: string;
  tone?: ToastTone;
  variant?: ToastVariant;
  hideIcon?: boolean;
  dismissible?: boolean;
  progress?: boolean;
  /**
   * The controls that act on the message, and the whole body when a message
   * needs one. A `TemplateRef` rather than a string, because Angular's answer
   * to "content the consumer writes" is a template it renders per message —
   * lazily, and with the message in its context, which is what
   * `MAT_SNACK_BAR_DATA` gives a Material consumer by another route.
   */
  actions?: TemplateRef<{ $implicit: ToastMessage<ToastContent> }>;
  body?: TemplateRef<{ $implicit: ToastMessage<ToastContent> }>;
  /** Anything the consumer's own template reads. */
  data?: unknown;
}

/** Everything one call can say about a message. */
export interface ToastInput extends ToastContent {
  id?: string;
  /** Milliseconds on screen. `0` never expires. */
  duration?: number;
  /** How loudly the announcer says it. Never inferred from the tone. */
  priority?: ToastPriority;
  /** What a reader hears. Built from the title and the description when unstated. */
  announcement?: string;
  /** Waiting on a promise: it does not expire and it draws no countdown. */
  loading?: boolean;
  onStatusChange?: (status: ToastStatus | 'removed', message: ToastMessage<ToastContent>) => void;
}

export interface ToastPromiseInput<Value> {
  loading: ToastInput;
  success: ToastInput | ((value: Value) => ToastInput);
  error: ToastInput | ((reason: unknown) => ToastInput);
}

export interface ToastDefaults {
  placement: ToastPlacement;
  attach: ToastAttach;
  stacking: ToastStacking;
  tone: ToastTone;
  variant: ToastVariant;
  priority: ToastPriority;
  dismissible: boolean;
  swipe: boolean;
  progress: boolean;
  pauseOnHover: boolean;
  pauseWhenHidden: boolean;
  limit: number;
  duration: number;
  swipeThreshold: number;
  hotkey: string;
}

/**
 * The key that moves focus into the region. Five surveyed implementations ship
 * a shortcut and no two chose the same key; `F6` is the one two of them chose
 * for the reason that generalizes — it is the landmark-navigation key.
 */
export const TOAST_HOTKEY = 'F6';

const FALLBACK: ToastDefaults = {
  placement: 'bottom-end',
  attach: 'portal',
  stacking: 'list',
  tone: 'accent',
  variant: 'raised',
  priority: 'polite',
  dismissible: true,
  swipe: true,
  progress: false,
  pauseOnHover: true,
  pauseWhenHidden: true,
  limit: 3,
  duration: 5000,
  swipeThreshold: 48,
  hotkey: TOAST_HOTKEY,
};

export const TOAST_DEFAULTS = new InjectionToken<ToastDefaults>('slotted toast defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once where its messages appear and how long they
 * stay. A region or a message that states any of them still wins: an explicit
 * value is never overridden by the token. The region's name and the close
 * control's come from the language in force (`provideSlotted`).
 */
export function provideToastDefaults(defaults: Partial<ToastDefaults>) {
  return {
    provide: TOAST_DEFAULTS,
    useFactory: (): ToastDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a region renders as here, before it states anything of its own. */
export function injectToastDefaults(): ToastDefaults {
  return inject(TOAST_DEFAULTS);
}

/** What a reader hears when the call did not say. */
function spokenFrom(input: ToastInput): string {
  if (input.announcement !== undefined) return input.announcement;
  return [input.title, input.description].filter(Boolean).join('. ');
}

/** The store's own fields, and the rest carried whole as the message's payload. */
function split(input: ToastInput) {
  const { id, duration, priority, announcement, loading, onStatusChange, ...content } = input;
  void announcement;

  return {
    ...(id === undefined ? {} : { id }),
    ...(duration === undefined ? {} : { duration }),
    ...(priority === undefined ? {} : { priority }),
    ...(loading === undefined ? {} : { loading }),
    ...(onStatusChange === undefined ? {} : { onStatusChange }),
    announcement: spokenFrom(input),
    /* The one field the store reads out of the content: a message a reader is
       meant to act on is a message no clock may end. */
    action: content.actions !== undefined,
    data: content as ToastContent,
  };
}

/**
 * The imperative facade, and the observable model, which
 * `docs/component-features.md` §14 asks for in one sentence.
 *
 * It is `providedIn: 'root'` because that is the surface Angular Material's
 * consumers already know: a message is shown from an interceptor, a resolver or
 * an effect, none of which is anywhere near a component. The reads are signals,
 * so a zoneless application renders on them without a `markForCheck` anywhere.
 */
@Injectable({ providedIn: 'root' })
export class SlToastService {
  private readonly defaults = inject(TOAST_DEFAULTS);

  /** The model a region renders. Also the escape hatch for a page's own host. */
  readonly store: ToastStore<ToastContent> = createToastStore<ToastContent>({
    limit: this.defaults.limit,
    duration: this.defaults.duration,
  });

  private readonly snapshot = signal(this.store.snapshot);

  /** The messages on screen, newest first. */
  readonly visible: Signal<readonly ToastMessage<ToastContent>[]> = computed(
    () => this.snapshot().visible,
  );
  /** The messages waiting behind the limit. A page may say how many. */
  readonly queued: Signal<readonly ToastMessage<ToastContent>[]> = computed(
    () => this.snapshot().queued,
  );
  /** Whether every clock is held. */
  readonly paused: Signal<boolean> = computed(() => this.snapshot().paused);

  constructor() {
    const stop = this.store.subscribe(() => this.snapshot.set(this.store.snapshot));
    inject(DestroyRef).onDestroy(() => {
      stop();
      this.store.destroy();
    });
  }

  /** Adds a message, or updates the one that already carries this id. */
  show(input: ToastInput = {}): string {
    return this.store.show(split(input));
  }

  /** Changes a message already in the queue, keeping its place. */
  update(id: string, input: ToastInput): void {
    this.store.update(id, split(input));
  }

  /** Asks for a message to leave, carrying the reason. */
  dismiss(id: string, reason: ToastReason = 'programmatic'): void {
    this.store.dismiss(id, reason);
  }

  /** Asks for every message to leave at once — a route change, a sign-out. */
  clear(reason: ToastReason = 'clear'): void {
    this.store.clear(reason);
  }

  pauseAll(): void {
    this.store.pauseAll();
  }

  resumeAll(): void {
    this.store.resumeAll();
  }

  /** A message that follows a promise: loading, then success or failure. */
  promise<Value>(promise: Promise<Value>, input: ToastPromiseInput<Value>): Promise<Value> {
    return this.store.promise(promise, {
      loading: split(input.loading),
      success:
        typeof input.success === 'function'
          ? (value: Value) => split((input.success as (value: Value) => ToastInput)(value))
          : split(input.success),
      error:
        typeof input.error === 'function'
          ? (reason: unknown) => split((input.error as (reason: unknown) => ToastInput)(reason))
          : split(input.error),
    });
  }
}
