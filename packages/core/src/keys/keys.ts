/**
 * What a shortcut is made of, resolved once for both bindings.
 *
 * Four decisions live here, and every one of them would otherwise be taken
 * twice — once in React and once in Angular — with no test able to prove the
 * two copies agree:
 *
 * 1. which key a token names on the reader's platform;
 * 2. which word a screen reader hears in place of a symbol;
 * 3. what order the modifiers are written in;
 * 4. what, if anything, is drawn between two keys.
 *
 * Nothing here touches the DOM or a framework, and nothing here binds a key.
 * Registering a shortcut is the application's, because WCAG 2.2 2.1.4
 * Character Key Shortcuts can only be answered by whoever knows whether the
 * shortcut can be turned off.
 */

import type { FamilyTranslator, KeysMessages, MessageSlots } from '../i18n';

export type KbdPlatform = 'mac' | 'windows' | 'linux' | 'other';

/** The `keys` catalog in the language in force: every word a key is written or heard as. */
export type KeysTranslator = FamilyTranslator<KeysMessages>;

/** `auto` asks the runtime; everything else states the answer. */
export type KbdPlatformInput = 'auto' | KbdPlatform;

export interface ResolvedKey {
  /** The canonical token, or `undefined` for a key the vocabulary does not hold. */
  token: string | undefined;
  /** What the eye sees. */
  legend: string;
  /**
   * What a reader hears, or `undefined` when the legend is already the word.
   * A key in the vocabulary always carries one: `⌘` is U+2318 PLACE OF INTEREST
   * SIGN, and `Ctrl` is an abbreviation whose pronunciation belongs to the
   * screen reader's dictionary rather than to this library.
   */
  name: string | undefined;
  /**
   * Whether the legend is a mark rather than a word — `⌘`, `↑`, `+`.
   *
   * It is resolved here rather than guessed by a stylesheet because it decides
   * two things a stylesheet cannot see: a mark is set in the interface face
   * rather than the monospaced one, whose symbol coverage is incidental to why
   * it was chosen; and a mark is not trimmed to the cap and the baseline,
   * because those are Latin metrics and a mark has no relation to either.
   */
  symbolic: boolean;
}

export interface ResolvedShortcut {
  /** The platform the legends were drawn for, so the DOM can say which. */
  platform: KbdPlatform;
  /** One entry per step of a sequence; each holds the keys pressed together. */
  steps: ResolvedKey[][];
  /** Between two simultaneous keys. Empty on a Mac, which joins with nothing. */
  separator: string;
  /** Between two steps of a sequence. Read aloud, because it is what makes a sequence one. */
  thenLabel: string;
}

export interface KeyOptions {
  platform: KbdPlatform;
  /** The words a key is written and heard as, from the `keys` catalog. */
  t: KeysTranslator;
  /** Replaces what the eye sees, per token. `{ ctrl: 'Strg' }`. */
  legends?: Readonly<Record<string, string>> | undefined;
  /** Replaces what the ear gets, per token. `{ ctrl: 'Steuerung' }`. */
  names?: Readonly<Record<string, string>> | undefined;
}

export interface ShortcutOptions extends KeyOptions {
  separator?: string | undefined;
}

/**
 * A key of the vocabulary. Its words — the legend where the platform writes
 * one, and the name a screen reader hears — live in the `keys` catalog under
 * the token; only the marks, which read the same in every language, live here.
 */
interface KeyDefinition {
  /** The mark Apple draws on a Mac in place of the word. */
  mac?: string;
  /** The mark every platform draws: the legend is never a word. */
  mark?: string;
  /**
   * Where the key sits among the modifiers, per platform. Absent for a key
   * that is not a modifier, which keeps the order it was written in.
   */
  order?: { mac: number; other: number };
}

/**
 * The vocabulary. Legends follow the platform each one belongs to: Apple's
 * symbols on a Mac, Microsoft's words on Windows, and the word everywhere the
 * platform has no opinion.
 *
 * `mod` and `meta` are two keys and not one. `mod` is whichever key the
 * platform accelerates with — ⌘ on a Mac and Ctrl everywhere else — and `meta`
 * is the physical Meta key, which is ⌘ on a Mac, the Windows key on Windows and
 * Super on a free desktop. Nuxt's `useKbd` is the only surveyed implementation
 * that resolves a modifier at all, and it holds one entry for both meanings, so
 * the same string tells a Windows reader to press ⌘ or a Mac reader to press the
 * Windows key depending on which meaning the author had.
 */
const KEYS: Readonly<Record<string, KeyDefinition>> = {
  mod: { mac: '⌘', order: { mac: 4, other: 2 } },
  meta: { mac: '⌘', order: { mac: 4, other: 1 } },
  ctrl: { mac: '⌃', order: { mac: 1, other: 2 } },
  alt: { mac: '⌥', order: { mac: 2, other: 3 } },
  shift: { mac: '⇧', order: { mac: 3, other: 4 } },
  /**
   * First on both platforms. It is a hardware key rather than an accelerator,
   * so it is written where a keyboard puts it — outside everything else.
   */
  fn: { order: { mac: 0, other: 0 } },

  enter: { mac: '↩' },
  escape: {},
  tab: { mac: '⇥' },
  /**
   * The word on every platform. `␣` is the Unicode open box, and a cap holding
   * one is a cap nobody can read at eleven pixels — the only legend in the
   * vocabulary where the symbol is less legible than the word it replaces.
   */
  space: {},
  backspace: { mac: '⌫' },
  delete: { mac: '⌦' },
  capslock: { mac: '⇪' },
  pageup: { mac: '⇞' },
  pagedown: { mac: '⇟' },
  home: { mac: '↖' },
  end: { mac: '↘' },
  /** The escape hatch for a literal plus, which is what the grammar splits on. */
  plus: { mark: '+' },
  up: { mark: '↑' },
  down: { mark: '↓' },
  left: { mark: '←' },
  right: { mark: '→' },
};

/** The names the field already writes, mapped onto the canonical token. */
const ALIASES: Readonly<Record<string, string>> = {
  cmd: 'meta',
  command: 'meta',
  win: 'meta',
  windows: 'meta',
  super: 'meta',
  control: 'ctrl',
  option: 'alt',
  opt: 'alt',
  return: 'enter',
  esc: 'escape',
  del: 'delete',
  bksp: 'backspace',
  caps: 'capslock',
  spacebar: 'space',
  pgup: 'pageup',
  pgdn: 'pagedown',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
};

export const KBD_KEYS: readonly string[] = Object.freeze(Object.keys(KEYS));

const FUNCTION_KEY = /^f([1-9]|1\d|2[0-4])$/;
const SINGLE_LETTER = /^\p{Letter}$/u;
const WORDLIKE = /[\p{Letter}\p{Number}]/u;

/** The catalog read by a key path built from a token, which the key types cannot follow. */
function word(t: KeysTranslator, path: string, platform: KbdPlatform) {
  return (t as unknown as (key: string, slots: MessageSlots) => string)(path, { platform });
}

/** The token of the vocabulary a written key names, or `undefined` for one it does not hold. */
export function canonicalKey(token: string): string | undefined {
  const lower = token.toLowerCase();
  return lower in KEYS ? lower : ALIASES[lower];
}

/**
 * Which platform's keyboard the reader has.
 *
 * `userAgentData.platform` is the declared answer and `navigator.platform` the
 * legacy one, and the absence of both is answered `other` rather than guessed.
 * That is what lets the server and the first client render agree: Nuxt resolves
 * this in `onMounted`, so a server-rendered `Ctrl` becomes `⌘` under the reader
 * after hydration. An application that knows its audience states the platform
 * instead and nothing is detected at all.
 */
export function resolvePlatform(input: KbdPlatformInput = 'auto'): KbdPlatform {
  if (input !== 'auto') return input;
  if (typeof navigator === 'undefined' || navigator === null) return 'other';

  const declared = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform;
  const platform =
    typeof declared === 'string' && declared.length > 0 ? declared : (navigator.platform ?? '');

  /* iPadOS reports `MacIntel`, an iPhone reports `iPhone`, and both take ⌘. */
  if (/mac|iphone|ipad|ipod/i.test(platform)) return 'mac';
  if (/win/i.test(platform)) return 'windows';
  if (/linux|x11|cros|android/i.test(platform)) return 'linux';
  return 'other';
}

/**
 * The steps of a shortcut, each holding the tokens pressed together.
 *
 * `+` joins simultaneous keys and whitespace joins sequential steps, which is
 * how Gmail, Linear and GitHub write the sequences none of the surveyed
 * implementations can express. An empty token is dropped rather than read as a
 * key, so `mod++k` never has to be understood: the literal plus is `plus`.
 */
export function parseShortcut(keys: string): string[][] {
  return keys
    .trim()
    .split(/\s+/)
    .filter((step) => step.length > 0)
    .map((step) => step.split('+').filter((token) => token.length > 0))
    .filter((step) => step.length > 0);
}

export function resolveKey(token: string, options: KeyOptions): ResolvedKey {
  const lower = token.toLowerCase();
  const canonical = canonicalKey(token);
  const definition = canonical === undefined ? undefined : KEYS[canonical];

  if (canonical === undefined || definition === undefined) {
    /* A function key is a word already; there is no other word to say. */
    if (FUNCTION_KEY.test(lower)) {
      return { token: undefined, legend: lower.toUpperCase(), name: undefined, symbolic: false };
    }
    /* Apple and Microsoft both write the letter of a shortcut in upper case. */
    const legend = SINGLE_LETTER.test(token) ? token.toUpperCase() : token;
    return { token: undefined, legend, name: undefined, symbolic: !WORDLIKE.test(legend) };
  }

  const { platform, t } = options;
  const legend =
    options.legends?.[canonical] ??
    (platform === 'mac' ? definition.mac : undefined) ??
    definition.mark ??
    word(t, `legends.${canonical}`, platform);

  return {
    token: canonical,
    legend,
    name: options.names?.[canonical] ?? word(t, `names.${canonical}`, platform),
    symbolic: !WORDLIKE.test(legend),
  };
}

function rank(token: string | undefined, platform: KbdPlatform) {
  if (token === undefined) return Number.MAX_SAFE_INTEGER;
  const order = KEYS[token]?.order;
  if (order === undefined) return Number.MAX_SAFE_INTEGER;
  return platform === 'mac' ? order.mac : order.other;
}

/**
 * A whole shortcut, in the order and the joining its platform uses.
 *
 * The reordering is the part no surveyed implementation does, and it is why one
 * authored string can be right on both platforms: the Apple Style Guide writes
 * Fn, Control, Option, Shift, Command, and Microsoft writes the Windows key
 * ahead of Ctrl, Alt and Shift. Keys that are not modifiers keep the order they
 * were written in, which is what makes a two-key chord readable.
 *
 * The escape hatch is composition rather than a fifth option: a shortcut whose
 * keys are authored one by one is rendered exactly as written.
 */
export function resolveShortcut(keys: string, options: ShortcutOptions): ResolvedShortcut {
  const { platform } = options;

  const steps = parseShortcut(keys).map((step) =>
    step
      .map((token, index) => ({ key: resolveKey(token, options), index }))
      .sort((a, b) => {
        const difference = rank(a.key.token, platform) - rank(b.key.token, platform);
        return difference === 0 ? a.index - b.index : difference;
      })
      .map(({ key }) => key),
  );

  return {
    platform,
    steps,
    /* macOS writes ⌘⇧K with nothing between the keys; Windows writes Ctrl+Shift+K. */
    separator: platform === 'mac' ? '' : (options.separator ?? '+'),
    thenLabel: options.t('then'),
  };
}

/** The DOM `key` value a token in the vocabulary arrives as. */
const DOM_KEYS: Readonly<Record<string, string>> = {
  enter: 'enter',
  escape: 'escape',
  tab: 'tab',
  space: ' ',
  backspace: 'backspace',
  delete: 'delete',
  capslock: 'capslock',
  pageup: 'pageup',
  pagedown: 'pagedown',
  home: 'home',
  end: 'end',
  plus: '+',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};

const MODIFIER_TOKENS = new Set(['mod', 'meta', 'ctrl', 'alt', 'shift']);

/**
 * Whether one keyboard event is the shortcut written.
 *
 * The header of this module says nothing here binds a key, and that is still
 * true: this answers a question about an event and registers nothing. The
 * family that opens on a shortcut asks it from its own listener, and the
 * consumer who binds an item's shortcut asks it from theirs. What is decided
 * here once is what `mod` means on the reader's platform — `Meta` on a Mac
 * and `Control` elsewhere — and that every modifier the event carries has to
 * have been asked for: `Ctrl+Shift+K` is not `Ctrl+K`.
 *
 * A sequence — `g` then `i` — is two events, and a question about one event
 * cannot answer it; it is `false` rather than a guess.
 */
export function matchesShortcut(
  event: KeyboardEvent,
  keys: string,
  platform: KbdPlatform,
): boolean {
  const steps = parseShortcut(keys);
  const step = steps[0];
  if (steps.length !== 1 || step === undefined) return false;

  const wanted = { meta: false, ctrl: false, alt: false, shift: false };
  let key: string | undefined;

  for (const token of step) {
    const canonical = canonicalKey(token) ?? token.toLowerCase();
    if (canonical === 'mod') {
      if (platform === 'mac') wanted.meta = true;
      else wanted.ctrl = true;
    } else if (MODIFIER_TOKENS.has(canonical)) {
      wanted[canonical as 'meta' | 'ctrl' | 'alt' | 'shift'] = true;
    } else {
      key = DOM_KEYS[canonical] ?? canonical;
    }
  }

  if (key === undefined) return false;
  if (wanted.meta !== (event.metaKey === true) || wanted.ctrl !== (event.ctrlKey === true)) {
    return false;
  }
  if (wanted.alt !== (event.altKey === true) || wanted.shift !== (event.shiftKey === true)) {
    return false;
  }
  return (event.key ?? '').toLowerCase() === key;
}

const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  '',
]);

/**
 * Whether the event landed on something the reader types into.
 *
 * `docs/component-features.md` §5 asks that a global shortcut not fire inside
 * an editable field without explicit intent; a bare `/` typed into a comment
 * is a character and not a command. A chord with a modifier is intent, and
 * the caller decides whether to ask this at all.
 */
export function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target as {
    tagName?: string;
    type?: string;
    isContentEditable?: boolean;
    readOnly?: boolean;
  } | null;
  if (target === null || typeof target !== 'object') return false;
  if (target.isContentEditable === true) return true;
  const tag = target.tagName?.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return TEXT_INPUT_TYPES.has((target.type ?? '').toLowerCase());
  return false;
}
