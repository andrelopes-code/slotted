/**
 * The queue of transient messages, and the clock that empties it.
 *
 * Every rule a toast has lives here, because every one of them is a rule two
 * bindings would otherwise answer twice: which messages are on screen and which
 * are waiting behind them, how long each has left, what stops the clock, what a
 * reader hears and when, and what a change is called when it is reported.
 *
 * Nothing here touches the DOM beyond one visibility listener, and nothing here
 * knows what a message looks like: `data` is the binding's own payload, carried
 * whole and never read. The four fields the rules do read — the duration, the
 * politeness, whether the message is waiting on a promise, and whether it
 * carries an action — are read because the rules are about them.
 *
 * ── The clock ────────────────────────────────────────────────────────────
 *
 * A message's timer starts when the message becomes **visible**, not when it is
 * created. Ark times the wait as well, so a message can be created, queue
 * behind three others, and be shown after the thing it is about has changed;
 * "five seconds" then means five seconds of something the reader never saw.
 *
 * It stops on three conditions and resumes on what was left: the pointer is
 * over the region, focus is inside it, or the document is hidden. Restarting
 * instead of resuming would turn a hover into an extension, which is a
 * different feature nobody asked for. The first two are the binding's to
 * report — only it knows where the pointer is — and the third is this module's,
 * because the Page Visibility API is not something a stylesheet or a binding
 * should each listen to separately.
 *
 * ── The announcement ─────────────────────────────────────────────────────
 *
 * Made once, when a message first becomes visible, through the shared
 * announcer. Coming back to a hidden tab announces the newest message only:
 * four sentences about a screen the reader has not looked at yet is worse than
 * one, and the other three are still on the screen to be read.
 */

import { getLiveAnnouncer } from '../live-announcer';
import type { Politeness } from '../live-announcer';
import { createControllable } from '../state';
import type { ChangeReason, ChangeRequest } from '../state';

export type ToastPriority = Politeness;

/**
 * Where a message is in its life. `closing` is the one a consumer's model does
 * not have: the message has been taken out of the queue the consumer sees and
 * is still in the document while it leaves.
 */
export type ToastStatus = 'queued' | 'visible' | 'closing';

/** Why a message left. The subset of the shared vocabulary this family emits. */
export type ToastReason = Extract<
  ChangeReason,
  'programmatic' | 'dismiss' | 'escape' | 'keyboard' | 'pointer' | 'timeout' | 'clear'
>;

export interface ToastOptions<Data> {
  /**
   * The message's own identifier. Showing a message whose id is already in the
   * queue updates that message rather than adding a second one, which is the
   * deduplication policy `docs/component-features.md` §14 asks for by name.
   */
  id?: string;
  /**
   * Milliseconds on screen. `0` never expires — `0` rather than `Infinity`,
   * because a queue a consumer can own is a value that gets serialized and
   * `Infinity` does not survive JSON.
   *
   * Left unstated it resolves to `0` for a message that is loading or carries
   * an action, and to the store's own default otherwise.
   */
  duration?: number;
  /** How loudly the announcer says it. Never inferred from the tone. */
  priority?: ToastPriority;
  /** What the announcer says. A message with none is shown and not spoken. */
  announcement?: string;
  /** Waiting on a promise: it does not expire, and it draws no countdown. */
  loading?: boolean;
  /**
   * The message carries a control that acts on it. Angular Material is the one
   * surveyed implementation that states the rule this serves — a message with
   * an action must not expire while a reader is on their way to it.
   */
  action?: boolean;
  /** The binding's payload. Carried whole, never read. */
  data?: Data;
  /** Called for every move this message makes, including its removal. */
  onStatusChange?: (status: ToastStatus | 'removed', message: ToastMessage<Data>) => void;
}

export interface ToastMessage<Data> {
  readonly id: string;
  readonly duration: number;
  readonly priority: ToastPriority;
  readonly announcement: string;
  readonly loading: boolean;
  readonly action: boolean;
  readonly data: Data;
  readonly status: ToastStatus;
  /**
   * How many times this message has been shown or updated. A binding keys its
   * own re-render on it, so an update to a message already on screen is one
   * message changing rather than two messages swapping.
   */
  readonly revision: number;
}

export interface ToastSnapshot<Data> {
  /** On screen, newest first. */
  readonly visible: readonly ToastMessage<Data>[];
  /** Waiting behind the limit, newest first. Timers have not started. */
  readonly queued: readonly ToastMessage<Data>[];
  /** Whether every clock is held. */
  readonly paused: boolean;
}

export interface ToastStoreOptions<Data> {
  /** How many messages are on screen at once. The rest wait. */
  limit?: number;
  /** The duration a message with nothing to say about its own takes. */
  duration?: number;
  /** The pointer over the region holds the clock. */
  pauseOnHover?: boolean;
  /** A hidden document holds the clock. */
  pauseWhenHidden?: boolean;
  /** The consumer's own queue. Present at all puts the store in controlled mode. */
  toasts?: readonly ToastMessage<Data>[] | undefined;
  /** The queue an uncontrolled store starts from, read once. */
  defaultToasts?: readonly ToastMessage<Data>[];
  /** Called before the queue moves, carrying the reason, and able to cancel it. */
  onRequest?: (request: ChangeRequest<readonly ToastMessage<Data>[]>) => void;
  /** The clock, for a test that does not want to wait five seconds. */
  now?: () => number;
  /** The document whose visibility is watched. Absent on a server. */
  document?: Document | undefined;
  /** Where an announcement goes. Defaults to the document's shared announcer. */
  announce?: (message: string, politeness: ToastPriority) => void;
}

export interface ToastPromiseOptions<Value, Data> {
  loading: ToastOptions<Data>;
  success: ToastOptions<Data> | ((value: Value) => ToastOptions<Data>);
  error: ToastOptions<Data> | ((reason: unknown) => ToastOptions<Data>);
}

/** What a host may retune after the store exists. */
export type ToastStoreSettings<Data> = Pick<
  ToastStoreOptions<Data>,
  'limit' | 'duration' | 'pauseOnHover' | 'pauseWhenHidden'
>;

export interface ToastStore<Data> {
  readonly snapshot: ToastSnapshot<Data>;
  /**
   * The values a host states rather than the store: how many messages its
   * region shows, how long they stay, and which of the two pointer conditions
   * hold the clock. They are settable rather than fixed at construction
   * because the store is created once, at module scope, and the region that
   * renders it is written in a tree that may say otherwise.
   */
  configure: (settings: ToastStoreSettings<Data>) => void;
  /** Adds a listener to every request, and returns the way to remove it. */
  onRequest: (
    listener: (request: ChangeRequest<readonly ToastMessage<Data>[]>) => void,
  ) => () => void;
  /** The shape `useSyncExternalStore` and an Angular signal both read. */
  subscribe: (listener: () => void) => () => void;
  /** Adds a message, or updates the one that already carries this id. */
  show: (options?: ToastOptions<Data>) => string;
  /** Changes a message already in the queue, keeping its place. */
  update: (id: string, options: ToastOptions<Data>) => void;
  /** Asks for a message to leave, carrying the reason. */
  dismiss: (id: string, reason?: ToastReason) => void;
  /** Takes a message out of the document once it has finished leaving. */
  remove: (id: string) => void;
  /** Asks for every message to leave at once — a route change, a sign-out. */
  clear: (reason?: ToastReason) => void;
  /** The pointer is over the region, or focus is inside it. */
  setInteracting: (interacting: boolean) => void;
  /** Holds every clock, and lets it go. For what the family cannot see. */
  pauseAll: () => void;
  resumeAll: () => void;
  /** How long this message has left, in milliseconds. `0` when it never expires. */
  remaining: (id: string) => number;
  /** A message that follows a promise: loading, then success or failure. */
  promise: <Value>(
    promise: Promise<Value>,
    options: ToastPromiseOptions<Value, Data>,
  ) => Promise<Value>;
  /** The consumer's new queue, in controlled mode. */
  sync: (toasts: readonly ToastMessage<Data>[] | undefined) => void;
  destroy: () => void;
}

export const DEFAULT_TOAST_LIMIT = 3;
export const DEFAULT_TOAST_DURATION = 5000;

let sequence = 0;

/**
 * Application-scoped rather than module-scoped would be better, and there is no
 * application here. The counter is only ever asked for an identifier a consumer
 * did not supply, and a server that renders two pages in one process never
 * reaches it: nothing shows a message during render.
 */
function nextId(): string {
  sequence += 1;
  return `slotted-toast-${sequence}`;
}

interface Clock {
  /** What is left when the timer is not running. */
  remaining: number;
  /** When the running timer was started, on the store's own clock. */
  startedAt: number | null;
  handle: ReturnType<typeof setTimeout> | null;
}

export function createToastStore<Data = unknown>(
  options: ToastStoreOptions<Data> = {},
): ToastStore<Data> {
  const { now = () => Date.now() } = options;

  let limit = options.limit ?? DEFAULT_TOAST_LIMIT;
  let defaultDuration = options.duration ?? DEFAULT_TOAST_DURATION;
  let pauseOnHover = options.pauseOnHover ?? true;
  let pauseWhenHidden = options.pauseWhenHidden ?? true;

  const requested = new Set<(request: ChangeRequest<readonly ToastMessage<Data>[]>) => void>();
  if (options.onRequest) requested.add(options.onRequest);

  const doc = options.document ?? (globalThis as { document?: Document }).document;
  const announce =
    options.announce ??
    ((message: string, politeness: ToastPriority) =>
      getLiveAnnouncer(doc).announce(message, { politeness }));

  const listeners = new Set<() => void>();
  const clocks = new Map<string, Clock>();
  const spoken = new Set<string>();
  const handlers = new Map<string, ToastOptions<Data>['onStatusChange']>();

  let messages: readonly ToastMessage<Data>[] = options.toasts ?? options.defaultToasts ?? [];
  let interacting = false;
  let hidden = pauseWhenHidden ? (doc?.hidden ?? false) : false;
  let held = false;
  let destroyed = false;
  let snapshot: ToastSnapshot<Data> = build();

  const state = createControllable<readonly ToastMessage<Data>[]>({
    controlled: options.toasts,
    initial: messages,
    equals: (a, b) => a === b,
    onRequest: (request) => {
      for (const listener of requested) listener(request);
    },
  });

  /* A visibility change is the one thing this module listens for itself: a
     five-second message shown to a tab nobody is looking at was never shown. */
  const onVisibility = () => {
    if (!pauseWhenHidden) return;
    const nowHidden = doc?.hidden ?? false;
    if (nowHidden === hidden) return;
    hidden = nowHidden;
    if (!hidden) speakLatest();
    settle();
  };
  if (pauseWhenHidden && doc) doc.addEventListener('visibilitychange', onVisibility);

  function paused(): boolean {
    return held || hidden || (pauseOnHover && interacting);
  }

  /**
   * The messages the screen is showing, in the order they arrived.
   *
   * A message that arrives when the screen is full **waits**, and the ones
   * already on it stay: Ark's answer rather than Base UI's, which pushes the
   * oldest off. The choice follows from the clock — a message whose five
   * seconds start when it becomes visible cannot be taken off the screen and
   * put back, and a reader half way through reading one should not lose it to
   * something that arrived after.
   *
   * A message on its way out keeps its place, because it is still in the
   * document and still one of the messages the limit is counting.
   */
  function admitted(): readonly ToastMessage<Data>[] {
    return messages.slice(0, limit);
  }

  function build(): ToastSnapshot<Data> {
    /* Newest first, which is the order the region renders and the order `F6`
       lands in: the message that just arrived is the one a reader wants. */
    return {
      visible: [...admitted()].reverse(),
      queued: messages.slice(limit),
      paused: paused(),
    };
  }

  function publish() {
    snapshot = build();
    for (const listener of listeners) listener();
  }

  function report(message: ToastMessage<Data>, status: ToastStatus | 'removed') {
    handlers.get(message.id)?.(status, message);
  }

  function replace(next: readonly ToastMessage<Data>[]) {
    messages = next;
    settle();
    publish();
  }

  /**
   * The queue as the consumer's model sees it, which never holds a message that
   * is on its way out. A request carrying a `closing` message would ask the
   * consumer to keep something they have already been told is gone.
   */
  function withoutClosing(list: readonly ToastMessage<Data>[]) {
    return list.filter((message) => message.status !== 'closing');
  }

  function request(next: readonly ToastMessage<Data>[], reason: ToastReason, source?: unknown) {
    return state.request(withoutClosing(next), reason, source);
  }

  /**
   * Which messages hold a running clock, and which hold what is left of one.
   * Called after every change, because every change can move a message across
   * the limit, and a message that has just become visible is a message whose
   * five seconds start now.
   */
  function settle() {
    const running = !paused();
    const visible = new Set(admitted().map((message) => message.id));

    for (const [id, clock] of clocks) {
      if (visible.has(id)) continue;
      stop(clock);
      clocks.delete(id);
    }

    for (const message of admitted()) {
      if (message.status === 'closing') {
        const closing = clocks.get(message.id);
        if (closing) stop(closing);
        continue;
      }
      if (message.duration <= 0) {
        clocks.delete(message.id);
        continue;
      }

      let clock = clocks.get(message.id);
      if (!clock) {
        clock = { remaining: message.duration, startedAt: null, handle: null };
        clocks.set(message.id, clock);
      }

      if (running && clock.handle === null) start(message.id, clock);
      if (!running && clock.handle !== null) stop(clock);
    }

    if (!hidden) speak();
  }

  function start(id: string, clock: Clock) {
    clock.startedAt = now();
    clock.handle = setTimeout(() => {
      clock.handle = null;
      clock.remaining = 0;
      dismiss(id, 'timeout');
    }, clock.remaining);
  }

  function stop(clock: Clock) {
    if (clock.handle === null) return;
    clearTimeout(clock.handle);
    clock.handle = null;
    if (clock.startedAt !== null) {
      clock.remaining = Math.max(0, clock.remaining - (now() - clock.startedAt));
    }
    clock.startedAt = null;
  }

  /** Every visible message that has not been spoken yet, oldest first. */
  function speak() {
    const pending = admitted().filter(
      (message) => message.status !== 'closing' && !spoken.has(message.id),
    );
    for (const message of pending) {
      spoken.add(message.id);
      if (message.announcement.length > 0) announce(message.announcement, message.priority);
    }
  }

  /**
   * Coming back to a tab that was hidden. Everything on screen is marked as
   * heard and the newest is the one actually said, because the reader is
   * looking at the screen now and the rest of it is there to be read.
   */
  function speakLatest() {
    const pending = admitted().filter(
      (message) => message.status !== 'closing' && !spoken.has(message.id),
    );
    for (const message of pending) spoken.add(message.id);
    const newest = pending.at(-1);
    if (newest && newest.announcement.length > 0) {
      announce(newest.announcement, newest.priority);
    }
  }

  /**
   * How long a message is given, first answer that applies. The second and the
   * third are the family's own rules rather than the field's: a message the
   * reader is meant to act on, and one that has not finished happening, are
   * both messages a clock has no business ending.
   */
  function resolveDuration(input: ToastOptions<Data>, previous?: ToastMessage<Data>): number {
    if (input.duration !== undefined) return Math.max(0, input.duration);
    if (input.loading ?? previous?.loading ?? false) return 0;
    if (input.action ?? previous?.action ?? false) return 0;
    return defaultDuration;
  }

  function compose(
    input: ToastOptions<Data>,
    previous: ToastMessage<Data> | undefined,
    id: string,
  ): ToastMessage<Data> {
    return {
      id,
      duration: resolveDuration(input, previous),
      priority: input.priority ?? previous?.priority ?? 'polite',
      announcement: input.announcement ?? previous?.announcement ?? '',
      loading: input.loading ?? previous?.loading ?? false,
      action: input.action ?? previous?.action ?? false,
      data: (input.data ?? previous?.data) as Data,
      status: 'visible',
      revision: (previous?.revision ?? 0) + 1,
    };
  }

  function show(input: ToastOptions<Data> = {}): string {
    if (destroyed) return input.id ?? '';
    const id = input.id ?? nextId();
    if (input.onStatusChange) handlers.set(id, input.onStatusChange);

    const previous = messages.find((message) => message.id === id);
    const message = compose(input, previous, id);

    /* An update keeps its place in the queue and starts its clock again: the
       message is new to the reader even when its identifier is not. */
    const next = previous
      ? messages.map((current) => (current.id === id ? message : current))
      : [...messages, message];

    clocks.delete(id);
    if (previous) spoken.delete(id);

    /* `request` reports whether the queue actually moved, which is true only
       when the store owns it and nothing refused. A controlled store waits for
       the consumer's next `sync`, and a refused request moves nothing at all. */
    if (request(next, 'programmatic')) {
      replace(next);
      report(message, 'visible');
    }
    return id;
  }

  function update(id: string, input: ToastOptions<Data>) {
    const previous = messages.find((message) => message.id === id);
    if (!previous) return;
    show({ ...input, id });
  }

  function dismiss(id: string, reason: ToastReason = 'programmatic', source?: unknown) {
    const message = messages.find((current) => current.id === id);
    if (!message || message.status === 'closing') return;

    const next = messages.filter((current) => current.id !== id);
    /* Controlled, or refused: nothing here moves. The consumer holds the queue
       and will pass the next one, or has said no. */
    if (!request(next, reason, source)) return;

    /* Uncontrolled, and accepted. The message leaves the consumer's model now
       and the document when `remove` says its exit has finished. */
    const closing: ToastMessage<Data> = { ...message, status: 'closing' };
    replace(messages.map((current) => (current.id === id ? closing : current)));
    report(closing, 'closing');
  }

  function remove(id: string) {
    const message = messages.find((current) => current.id === id);
    if (!message) return;
    clocks.delete(id);
    spoken.delete(id);
    replace(messages.filter((current) => current.id !== id));
    report(message, 'removed');
    handlers.delete(id);
  }

  function clear(reason: ToastReason = 'clear') {
    if (messages.length === 0) return;
    if (!request([], reason)) return;
    for (const clock of clocks.values()) stop(clock);
    clocks.clear();
    spoken.clear();
    const leaving = messages;
    replace(messages.map((message) => ({ ...message, status: 'closing' as const })));
    for (const message of leaving) report(message, 'closing');
  }

  return {
    get snapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onRequest(listener) {
      requested.add(listener);
      return () => requested.delete(listener);
    },
    configure(settings) {
      const before = [limit, defaultDuration, pauseOnHover, pauseWhenHidden];
      limit = settings.limit ?? limit;
      defaultDuration = settings.duration ?? defaultDuration;
      pauseOnHover = settings.pauseOnHover ?? pauseOnHover;
      pauseWhenHidden = settings.pauseWhenHidden ?? pauseWhenHidden;
      if (
        before.every(
          (value, index) =>
            value === [limit, defaultDuration, pauseOnHover, pauseWhenHidden][index],
        )
      ) {
        return;
      }
      settle();
      publish();
    },
    show,
    update,
    dismiss: (id, reason) => dismiss(id, reason),
    remove,
    clear,
    setInteracting(next) {
      if (next === interacting) return;
      interacting = next;
      settle();
      publish();
    },
    pauseAll() {
      if (held) return;
      held = true;
      settle();
      publish();
    },
    resumeAll() {
      if (!held) return;
      held = false;
      settle();
      publish();
    },
    remaining(id) {
      const clock = clocks.get(id);
      if (!clock) return 0;
      if (clock.handle === null || clock.startedAt === null) return clock.remaining;
      return Math.max(0, clock.remaining - (now() - clock.startedAt));
    },
    promise(promise, promiseOptions) {
      const id = show({ ...promiseOptions.loading, loading: true });
      return promise.then(
        (value) => {
          const resolved =
            typeof promiseOptions.success === 'function'
              ? promiseOptions.success(value)
              : promiseOptions.success;
          update(id, { ...resolved, loading: false });
          return value;
        },
        (cause: unknown) => {
          const rejected =
            typeof promiseOptions.error === 'function'
              ? promiseOptions.error(cause)
              : promiseOptions.error;
          update(id, { ...rejected, loading: false });
          throw cause;
        },
      );
    },
    sync(toasts) {
      if (!state.controlled || toasts === undefined || toasts === messages) return;
      state.sync(toasts);
      replace(toasts);
    },
    destroy() {
      destroyed = true;
      for (const clock of clocks.values()) stop(clock);
      clocks.clear();
      listeners.clear();
      handlers.clear();
      spoken.clear();
      if (pauseWhenHidden && doc) doc.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
