import { createToastStore } from '@slotted/core/toast';
import type { ToastMessage } from '@slotted/core/toast';
import { createContext, useContext } from 'react';

import type {
  ToastContent,
  ToastDefaults,
  ToastDefaultsProviderProps,
  ToastInput,
  Toaster,
  ToastPromiseInput,
} from './toast.types';

/**
 * The key that moves focus into the region.
 *
 * Five surveyed implementations ship a shortcut and no two chose the same key:
 * Radix `F8`, Base UI `F6`, React Aria `F6`, Ark and Sonner `Alt+T`. `F6` is
 * the one two of them chose for the reason that generalises — it is the
 * landmark-navigation key, and the region is a landmark.
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

const ToastDefaultsContext = createContext<ToastDefaults>(FALLBACK);

/** What a region renders as here, before it states anything of its own. */
export function useToastDefaults(): ToastDefaults {
  return useContext(ToastDefaultsContext);
}

/**
 * An application decides once where its messages appear, how long they stay
 * and how they are painted, rather than repeating the same props on every
 * region and every call. A region or a message that states any of them still
 * wins: an explicit value is never overridden by context. The region's name
 * and the close control's come from the language in force (`SlottedProvider`).
 */
export function ToastDefaultsProvider({ children, ...defaults }: ToastDefaultsProviderProps) {
  const inherited = useToastDefaults();

  return (
    <ToastDefaultsContext.Provider
      value={{
        placement: defaults.placement ?? inherited.placement,
        attach: defaults.attach ?? inherited.attach,
        stacking: defaults.stacking ?? inherited.stacking,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
        priority: defaults.priority ?? inherited.priority,
        dismissible: defaults.dismissible ?? inherited.dismissible,
        swipe: defaults.swipe ?? inherited.swipe,
        progress: defaults.progress ?? inherited.progress,
        pauseOnHover: defaults.pauseOnHover ?? inherited.pauseOnHover,
        pauseWhenHidden: defaults.pauseWhenHidden ?? inherited.pauseWhenHidden,
        limit: defaults.limit ?? inherited.limit,
        duration: defaults.duration ?? inherited.duration,
        swipeThreshold: defaults.swipeThreshold ?? inherited.swipeThreshold,
        hotkey: defaults.hotkey ?? inherited.hotkey,
      }}
    >
      {children}
    </ToastDefaultsContext.Provider>
  );
}

/**
 * What a reader hears when the call did not say. Two strings joined; anything
 * else is left to the caller, because a component's rendered text is not
 * readable from here and guessing at it would announce markup.
 */
function spokenFrom(input: ToastInput): string {
  if (input.announcement !== undefined) return input.announcement;
  const parts = [input.title, input.description].filter(
    (part): part is string => typeof part === 'string',
  );
  return parts.join('. ');
}

/** The store's own fields, and the rest carried whole as the message's payload. */
function split(input: ToastInput) {
  /* `announcement` is read by `spokenFrom` rather than carried through, so it
     is dropped here on purpose. */
  const { id, duration, priority, loading, onStatusChange, ...rest } = input;
  const { announcement, ...content } = rest;
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
 * A store, and the imperative facade over it. Both are the same object seen
 * from two sides: `docs/component-features.md` §14 asks for a convenient
 * service, a declarative host and an observable model, and this is the first
 * and the third.
 */
export function createToaster(options: { limit?: number; duration?: number } = {}): Toaster {
  const store = createToastStore<ToastContent>({
    limit: options.limit ?? FALLBACK.limit,
    duration: options.duration ?? FALLBACK.duration,
  });

  return {
    store,
    show: (input = {}) => store.show(split(input)),
    update: (id, input) => store.update(id, split(input)),
    dismiss: (id, reason) => store.dismiss(id, reason),
    clear: (reason) => store.clear(reason),
    pauseAll: () => store.pauseAll(),
    resumeAll: () => store.resumeAll(),
    promise: <Value,>(promise: Promise<Value>, input: ToastPromiseInput<Value>) =>
      store.promise(promise, {
        loading: split(input.loading),
        success:
          typeof input.success === 'function'
            ? (value: Value) => split((input.success as (value: Value) => ToastInput)(value))
            : split(input.success),
        error:
          typeof input.error === 'function'
            ? (reason: unknown) => split((input.error as (reason: unknown) => ToastInput)(reason))
            : split(input.error),
      }),
  };
}

/**
 * The shared toaster, so a message can be shown from anywhere without a hook
 * and without threading a reference through the tree. React Aria's queue is
 * the same decision, for the same reason.
 */
export const toast: Toaster = createToaster();

/** Which toaster the region under this provider renders. */
const ToasterContext = createContext<Toaster>(toast);

export const ToasterProvider = ToasterContext.Provider;

export function useToaster(): Toaster {
  return useContext(ToasterContext);
}

export type { ToastMessage };
