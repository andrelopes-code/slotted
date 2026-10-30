import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * How a key is written and how it is heard, for `kbd` and for every family
 * that shows a shortcut (`command-palette`, `menu`). `{platform}` is `mac`,
 * `windows`, `linux` or `other`. A legend Apple draws as a symbol (⌘, ⇧, ↩)
 * is a symbol in every language and stays out of the catalog.
 */
export interface KeysMessages {
  /** What the eye reads on a key cap, where the platform writes a word. */
  readonly legends: {
    readonly mod: Message;
    readonly meta: Message<{ platform: string }>;
    readonly ctrl: Message;
    readonly alt: Message;
    readonly shift: Message;
    readonly fn: Message<{ platform: string }>;
    readonly enter: Message;
    readonly escape: Message;
    readonly tab: Message;
    readonly space: Message;
    readonly backspace: Message;
    readonly delete: Message;
    readonly capslock: Message;
    readonly pageup: Message;
    readonly pagedown: Message;
    readonly home: Message;
    readonly end: Message;
  };
  /** What a screen reader says for the key. */
  readonly names: {
    readonly mod: Message<{ platform: string }>;
    readonly meta: Message<{ platform: string }>;
    readonly ctrl: Message;
    readonly alt: Message<{ platform: string }>;
    readonly shift: Message;
    readonly fn: Message;
    readonly enter: Message<{ platform: string }>;
    readonly escape: Message;
    readonly tab: Message;
    readonly space: Message;
    readonly backspace: Message<{ platform: string }>;
    readonly delete: Message<{ platform: string }>;
    readonly capslock: Message;
    readonly pageup: Message;
    readonly pagedown: Message;
    readonly home: Message;
    readonly end: Message;
    readonly plus: Message;
    readonly up: Message;
    readonly down: Message;
    readonly left: Message;
    readonly right: Message;
  };
  /** Between two steps of a sequence: `G then I`. */
  readonly then: Message;
}

export const en: KeysMessages = {
  legends: {
    mod: 'Ctrl',
    meta: '{platform, select, windows {Win} linux {Super} other {Meta}}',
    ctrl: 'Ctrl',
    alt: 'Alt',
    shift: 'Shift',
    fn: '{platform, select, mac {fn} other {Fn}}',
    enter: 'Enter',
    escape: 'Esc',
    tab: 'Tab',
    space: 'Space',
    backspace: 'Backspace',
    delete: 'Del',
    capslock: 'Caps Lock',
    pageup: 'Page Up',
    pagedown: 'Page Down',
    home: 'Home',
    end: 'End',
  },
  names: {
    mod: '{platform, select, mac {Command} other {Control}}',
    meta: '{platform, select, mac {Command} windows {Windows} linux {Super} other {Meta}}',
    ctrl: 'Control',
    alt: '{platform, select, mac {Option} other {Alt}}',
    shift: 'Shift',
    fn: 'Function',
    enter: '{platform, select, mac {Return} other {Enter}}',
    escape: 'Escape',
    tab: 'Tab',
    space: 'Space',
    backspace: '{platform, select, mac {Delete} other {Backspace}}',
    delete: '{platform, select, mac {Forward delete} other {Delete}}',
    capslock: 'Caps lock',
    pageup: 'Page up',
    pagedown: 'Page down',
    home: 'Home',
    end: 'End',
    plus: 'Plus',
    up: 'Up arrow',
    down: 'Down arrow',
    left: 'Left arrow',
    right: 'Right arrow',
  },
  then: 'then',
};

export const keysMessages: MessageFamily<'keys', KeysMessages> = { name: 'keys', base: en };
