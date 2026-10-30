import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

import type { KeysMessages, PartialMessages } from '@slotted/core/i18n';
import type { KbdPlatform, KbdPlatformInput } from '@slotted/core/keys';

export type { KbdPlatform, KbdPlatformInput } from '@slotted/core/keys';

/**
 * Four absolute heights — 16, 20, 24 and 28 pixels — and one that reads the text
 * around it. `inherit` is the step prose wants: an absolute cap inside a heading
 * is a stamp, and one in fine print is a slab.
 */
export type KbdSize = 'xs' | 'sm' | 'md' | 'lg' | 'inherit';

/**
 * `raised` is the only value that looks like a key. `outline` owns no ground,
 * so it carries over any surface. `soft` is the tinted chip. `plain` is the
 * menu-row form, and it takes the color of the text it sits in.
 */
export type KbdVariant = 'raised' | 'outline' | 'soft' | 'plain';

/** What an application sets once for every key under it. */
export interface KbdDefaults {
  /**
   * `auto` asks the runtime. State it instead where the page is rendered on a
   * server: the resolution is hydration-safe either way, but a stated platform
   * is the only one that is right on the very first paint.
   */
  platform: KbdPlatformInput;
  size: KbdSize;
  variant: KbdVariant;
  /** Between two simultaneous keys. A Mac joins with nothing whatever this says. */
  separator: string;
  /** Replaces what the eye sees, per key token: `{ ctrl: 'Strg' }`. */
  legends: Readonly<Record<string, string>> | undefined;
  /** Replaces what a reader hears, per key token: `{ ctrl: 'Steuerung' }`. */
  names: Readonly<Record<string, string>> | undefined;
}

export interface KbdDefaultsProviderProps extends Partial<KbdDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives. It names the family's own attributes over the native
 * ones every element shares; `ref` is not named because the element the
 * consumer renders decides its own type, and React passes it through the same
 * spread either way.
 */
export interface KbdRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-disabled'?: '' | undefined;
  'data-key'?: string | undefined;
  'data-part': string;
  'data-platform'?: KbdPlatform | undefined;
  'data-size': KbdSize;
  'data-ui': string;
  'data-variant': KbdVariant;
}

export interface KbdProps extends ComponentPropsWithRef<'kbd'> {
  /**
   * The legend, written verbatim: the application's own word, neither resolved
   * nor given a hidden name. `keyName` wins over it where both are written.
   */
  children?: ReactNode | undefined;
  /**
   * Dims the key without claiming the item's semantics. `kbd` may carry only
   * the global ARIA attributes, and `aria-disabled` is not one of them, so the
   * row this key belongs to is what says it is unavailable.
   */
  disabled?: boolean | undefined;
  /**
   * A token from the vocabulary — `mod`, `meta`, `shift`, `escape`, `up` — or
   * any of its aliases. It resolves to the legend the reader's platform draws
   * and the word a screen reader hears in place of it.
   */
  keyName?: string | undefined;
  /**
   * Words laid over the `keys` catalog of the language in force, key by key:
   * `legends.*` for what a cap shows, `names.*` for what a reader hears.
   */
  messages?: PartialMessages<KeysMessages> | undefined;
  /** Defaults to the provider, then to `auto`. */
  platform?: KbdPlatformInput | undefined;
  /** Renders the wiring into another element, keeping the axes and the parts. */
  render?: ((props: KbdRootProps) => ReactNode) | undefined;
  /** Defaults to the group, then to the provider, then to `md`. */
  size?: KbdSize | undefined;
  /** Defaults to the group, then to the provider, then to `raised`. */
  variant?: KbdVariant | undefined;
}

export interface KbdShortcutRootProps extends KbdRootProps {
  'data-platform': KbdPlatform;
}

export interface ShortcutProps extends ComponentPropsWithRef<'kbd'> {
  /** Keys authored one by one, when the order or the wording is the page's own. */
  children?: ReactNode | undefined;
  disabled?: boolean | undefined;
  /**
   * The shortcut, written once: `+` joins keys pressed together and whitespace
   * joins the steps of a sequence. The modifiers are reordered into the
   * platform's own convention, so `mod+shift+alt+p` is `⌥⇧⌘P` on a Mac and
   * `Ctrl+Alt+Shift+P` on Windows.
   */
  keys?: string | undefined;
  /** Replaces what the eye sees, per key token. Defaults to the provider. */
  legends?: Readonly<Record<string, string>> | undefined;
  /**
   * Words laid over the `keys` catalog of the language in force, key by key:
   * `legends.*`, `names.*`, and `then` between two steps of a sequence.
   */
  messages?: PartialMessages<KeysMessages> | undefined;
  /** Replaces what a reader hears, per key token. Defaults to the provider. */
  names?: Readonly<Record<string, string>> | undefined;
  platform?: KbdPlatformInput | undefined;
  render?: ((props: KbdShortcutRootProps) => ReactNode) | undefined;
  /** Between two simultaneous keys. Defaults to the provider, then to `+`. */
  separator?: string | undefined;
  size?: KbdSize | undefined;
  variant?: KbdVariant | undefined;
}
