import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTranslator, keysMessages } from '../i18n';
import { PT_BR } from '../i18n/locales/pt-BR';
import {
  canonicalKey,
  isEditableTarget,
  KBD_KEYS,
  matchesShortcut,
  parseShortcut,
  resolveKey,
  resolvePlatform,
  resolveShortcut,
} from './keys';

const t = createTranslator({ locale: 'en-US' }).family(keysMessages);
const pt = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(keysMessages);

const legendsOf = (keys: string, platform: Parameters<typeof resolveShortcut>[1]['platform']) =>
  resolveShortcut(keys, { platform, t }).steps.map((step) => step.map((key) => key.legend));

describe('resolvePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a stated platform without asking the runtime', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(resolvePlatform('windows')).toBe('windows');
  });

  /**
   * The server has no `navigator`, and a resolution that threw or guessed
   * `mac` there would render one shortcut on the server and another on the
   * client. `other` is the only answer that is true before the client is known.
   */
  it('answers other where there is no navigator at all', () => {
    vi.stubGlobal('navigator', undefined);
    expect(resolvePlatform('auto')).toBe('other');
    expect(resolvePlatform()).toBe('other');
  });

  it('prefers the declared platform over the legacy one', () => {
    vi.stubGlobal('navigator', { userAgentData: { platform: 'Windows' }, platform: 'MacIntel' });
    expect(resolvePlatform('auto')).toBe('windows');
  });

  it('reads the legacy platform when nothing declares one', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(resolvePlatform('auto')).toBe('mac');
  });

  /** iPadOS reports `MacIntel`, and an iPhone reports `iPhone`. Both take ⌘. */
  it('counts every Apple device as mac', () => {
    for (const platform of ['MacIntel', 'iPhone', 'iPad', 'iPod touch', 'macOS']) {
      vi.stubGlobal('navigator', { platform });
      expect(resolvePlatform('auto')).toBe('mac');
    }
  });

  it('tells Windows from the free desktops', () => {
    vi.stubGlobal('navigator', { platform: 'Win32' });
    expect(resolvePlatform('auto')).toBe('windows');
    vi.stubGlobal('navigator', { platform: 'Linux x86_64' });
    expect(resolvePlatform('auto')).toBe('linux');
    vi.stubGlobal('navigator', { platform: 'SunOS' });
    expect(resolvePlatform('auto')).toBe('other');
  });
});

describe('parseShortcut', () => {
  it('joins simultaneous keys with a plus and sequential steps with a space', () => {
    expect(parseShortcut('mod+shift+p')).toEqual([['mod', 'shift', 'p']]);
    expect(parseShortcut('g i')).toEqual([['g'], ['i']]);
    expect(parseShortcut('mod+k mod+p')).toEqual([
      ['mod', 'k'],
      ['mod', 'p'],
    ]);
  });

  it('reads a run of whitespace as one step break', () => {
    expect(parseShortcut('  g \n\t i  ')).toEqual([['g'], ['i']]);
  });

  it('holds nothing for an empty string, rather than one empty step', () => {
    expect(parseShortcut('')).toEqual([]);
    expect(parseShortcut('   ')).toEqual([]);
  });

  /**
   * The ambiguity every string grammar in the field breaks on. `plus` is a
   * token, so `mod++` never has to be understood: the separator characters and
   * the keys named after them do not collide.
   */
  it('drops an empty token rather than inventing a key from a stray plus', () => {
    expect(parseShortcut('mod++k')).toEqual([['mod', 'k']]);
    expect(parseShortcut('mod+plus')).toEqual([['mod', 'plus']]);
  });
});

describe('resolveKey', () => {
  /**
   * The split Nuxt's `useKbd` does not make. `mod` is whichever key the
   * platform accelerates with; `meta` is the physical Meta key. Conflating
   * them tells a Windows reader to press ⌘, or a Mac reader to press the
   * Windows key, depending on which meaning the author had in mind.
   */
  it('tells the platform accelerator from the Meta key', () => {
    expect(resolveKey('mod', { platform: 'mac', t })).toMatchObject({
      legend: '⌘',
      name: 'Command',
    });
    expect(resolveKey('mod', { platform: 'windows', t })).toMatchObject({
      legend: 'Ctrl',
      name: 'Control',
    });
    expect(resolveKey('meta', { platform: 'mac', t })).toMatchObject({
      legend: '⌘',
      name: 'Command',
    });
    expect(resolveKey('meta', { platform: 'windows', t })).toMatchObject({
      legend: 'Win',
      name: 'Windows',
    });
    expect(resolveKey('meta', { platform: 'linux', t })).toMatchObject({
      legend: 'Super',
      name: 'Super',
    });
  });

  it('draws the Mac symbols and writes the words everywhere else', () => {
    expect(legendsOf('ctrl+alt+shift+k', 'mac')).toEqual([['⌃', '⌥', '⇧', 'K']]);
    expect(legendsOf('ctrl+alt+shift+k', 'windows')).toEqual([['Ctrl', 'Alt', 'Shift', 'K']]);
  });

  it('is case-insensitive about the token and upper-cases a single letter', () => {
    expect(resolveKey('SHIFT', { platform: 'mac', t }).legend).toBe('⇧');
    expect(resolveKey('k', { platform: 'mac', t }).legend).toBe('K');
    expect(resolveKey('K', { platform: 'mac', t }).legend).toBe('K');
  });

  /**
   * A single letter is already the word a reader hears, so it carries no
   * hidden name. Every key in the vocabulary carries one, including the ones
   * whose legend is a word: `Ctrl` is an abbreviation, and what a screen reader
   * makes of it depends on its pronunciation dictionary rather than on us.
   */
  it('names every key in the vocabulary, and only those', () => {
    expect(resolveKey('k', { platform: 'mac', t }).name).toBeUndefined();
    expect(resolveKey('Send', { platform: 'mac', t }).name).toBeUndefined();
    expect(resolveKey('ctrl', { platform: 'windows', t })).toMatchObject({
      legend: 'Ctrl',
      name: 'Control',
    });
    expect(resolveKey('f6', { platform: 'mac', t })).toMatchObject({
      legend: 'F6',
      name: undefined,
    });
  });

  it('reads the aliases the field already writes', () => {
    for (const [alias, token] of [
      ['cmd', 'meta'],
      ['command', 'meta'],
      ['win', 'meta'],
      ['super', 'meta'],
      ['control', 'ctrl'],
      ['option', 'alt'],
      ['opt', 'alt'],
      ['return', 'enter'],
      ['esc', 'escape'],
      ['del', 'delete'],
      ['arrowup', 'up'],
      ['pgdn', 'pagedown'],
      ['spacebar', 'space'],
    ] as const) {
      expect(resolveKey(alias, { platform: 'mac', t }).token).toBe(token);
    }
  });

  /** An arrow legend is the physical key, so it is the same key in every language. */
  it('names an arrow rather than leaving the glyph to be read', () => {
    expect(resolveKey('left', { platform: 'windows', t })).toMatchObject({
      legend: '←',
      name: 'Left arrow',
    });
  });

  it('lets an application replace a legend and a name without touching either binding', () => {
    expect(
      resolveKey('ctrl', {
        platform: 'windows',
        t,
        legends: { ctrl: 'Strg' },
        names: { ctrl: 'Steuerung' },
      }),
    ).toMatchObject({ legend: 'Strg', name: 'Steuerung' });
  });

  /**
   * A mark is set in the interface face rather than the monospaced one and is
   * not trimmed to the cap and the baseline, so whether a legend is one has to
   * be resolved here: a stylesheet cannot look at the string.
   */
  it('says whether the legend is a mark or a word', () => {
    for (const token of ['mod', 'shift', 'up', 'enter', 'plus']) {
      expect(resolveKey(token, { platform: 'mac', t }).symbolic).toBe(true);
    }
    for (const token of ['mod', 'shift', 'escape', 'space', 'f6', 'k']) {
      expect(resolveKey(token, { platform: 'windows', t }).symbolic).toBe(false);
    }
    /* A replaced legend is judged on what it became, not on what it was. */
    expect(resolveKey('ctrl', { platform: 'mac', t, legends: { ctrl: 'Strg' } }).symbolic).toBe(
      false,
    );
  });

  it('writes and names a key in the language of the catalog it is given', () => {
    expect(resolveKey('space', { platform: 'windows', t: pt })).toMatchObject({
      // language: pt-BR
      legend: 'Espaço',
      name: 'Espaço',
      // language: en-US
    });
    expect(resolveKey('left', { platform: 'mac', t: pt })).toMatchObject({
      legend: '←',
      name: 'Seta para a esquerda',
    });
    expect(resolveKey('fn', { platform: 'mac', t }).legend).toBe('fn');
    expect(resolveKey('fn', { platform: 'windows', t }).legend).toBe('Fn');
  });

  it('answers the canonical token of a written key without any words', () => {
    expect(canonicalKey('Cmd')).toBe('meta');
    expect(canonicalKey('ArrowLeft')).toBe('left');
    expect(canonicalKey('k')).toBeUndefined();
  });

  /** A token the vocabulary does not hold is the application's own word. */
  it('renders an unknown token exactly as it was written', () => {
    expect(resolveKey('Any key', { platform: 'mac', t })).toMatchObject({
      token: undefined,
      legend: 'Any key',
      name: undefined,
    });
  });
});

describe('resolveShortcut', () => {
  /**
   * Apple Style Guide order is Fn, Control, Option, Shift, Command; Microsoft
   * writes Ctrl + Alt + Shift with the Windows key ahead of them. Every
   * surveyed implementation renders the author's order verbatim, so the same
   * string is wrong on one of the two platforms.
   */
  it('reorders the modifiers into the platform’s own convention', () => {
    expect(legendsOf('mod+shift+alt+ctrl+k', 'mac')).toEqual([['⌃', '⌥', '⇧', '⌘', 'K']]);
    expect(legendsOf('shift+meta+alt+ctrl+k', 'windows')).toEqual([
      ['Win', 'Ctrl', 'Alt', 'Shift', 'K'],
    ]);
  });

  it('keeps the keys that are not modifiers in the order they were written', () => {
    expect(legendsOf('shift+k+j', 'mac')).toEqual([['⇧', 'K', 'J']]);
  });

  /** macOS writes ⌘⇧K with nothing between the keys; Windows writes Ctrl+Shift+K. */
  it('joins by platform, and joins with nothing on a Mac', () => {
    expect(resolveShortcut('mod+k', { platform: 'mac', t }).separator).toBe('');
    expect(resolveShortcut('mod+k', { platform: 'windows', t }).separator).toBe('+');
    expect(resolveShortcut('mod+k', { platform: 'windows', t, separator: ' · ' }).separator).toBe(
      ' · ',
    );
  });

  it('carries the word that joins two steps of a sequence', () => {
    const resolved = resolveShortcut('g i', { platform: 'mac', t });
    expect(resolved.steps).toEqual([
      [{ token: undefined, legend: 'G', name: undefined, symbolic: false }],
      [{ token: undefined, legend: 'I', name: undefined, symbolic: false }],
    ]);
    expect(resolved.thenLabel).toBe('then');
    expect(resolveShortcut('g i', { platform: 'mac', t: pt }).thenLabel).toBe('depois');
  });

  it('reports the platform it resolved to, so the DOM can say so', () => {
    expect(resolveShortcut('mod+k', { platform: 'linux', t }).platform).toBe('linux');
  });

  it('resolves nothing for an empty shortcut, rather than an empty cap', () => {
    expect(resolveShortcut('', { platform: 'mac', t }).steps).toEqual([]);
  });
});

describe('KBD_KEYS', () => {
  it('names every canonical token once, and each one resolves', () => {
    expect(new Set(KBD_KEYS).size).toBe(KBD_KEYS.length);
    for (const token of KBD_KEYS) {
      const resolved = resolveKey(token, { platform: 'mac', t });
      expect(resolved.token).toBe(token);
      expect(resolved.legend.length).toBeGreaterThan(0);
      expect(resolved.name?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe('matchesShortcut', () => {
  const press = (init: Partial<KeyboardEvent>) => init as KeyboardEvent;

  it('reads mod as Meta on a Mac and as Control elsewhere', () => {
    expect(matchesShortcut(press({ key: 'k', metaKey: true }), 'mod+k', 'mac')).toBe(true);
    expect(matchesShortcut(press({ key: 'k', ctrlKey: true }), 'mod+k', 'mac')).toBe(false);
    expect(matchesShortcut(press({ key: 'k', ctrlKey: true }), 'mod+k', 'windows')).toBe(true);
    expect(matchesShortcut(press({ key: 'k', metaKey: true }), 'mod+k', 'linux')).toBe(false);
  });

  it('refuses a modifier the shortcut did not ask for', () => {
    expect(
      matchesShortcut(press({ key: 'k', ctrlKey: true, shiftKey: true }), 'mod+k', 'windows'),
    ).toBe(false);
    expect(
      matchesShortcut(press({ key: 'K', ctrlKey: true, shiftKey: true }), 'mod+shift+k', 'windows'),
    ).toBe(true);
  });

  it('compares the key without regard to case or the order the tokens were written in', () => {
    expect(matchesShortcut(press({ key: 'K', metaKey: true }), 'k+mod', 'mac')).toBe(true);
  });

  it('reads a named key by its DOM name', () => {
    expect(matchesShortcut(press({ key: 'Escape' }), 'esc', 'linux')).toBe(true);
    expect(matchesShortcut(press({ key: 'ArrowDown', altKey: true }), 'alt+down', 'linux')).toBe(
      true,
    );
    expect(matchesShortcut(press({ key: '/' }), '/', 'mac')).toBe(true);
  });

  /** A sequence has no single event to match, so it never matches one. */
  it('answers false for a sequence', () => {
    expect(matchesShortcut(press({ key: 'g' }), 'g i', 'mac')).toBe(false);
  });
});

describe('isEditableTarget', () => {
  const target = (init: Record<string, unknown>) => ({ target: init }) as unknown as KeyboardEvent;

  it('names a text input, a textarea, a select and an editable region', () => {
    expect(isEditableTarget(target({ tagName: 'INPUT', type: 'text' }))).toBe(true);
    expect(isEditableTarget(target({ tagName: 'TEXTAREA' }))).toBe(true);
    expect(isEditableTarget(target({ tagName: 'SELECT' }))).toBe(true);
    expect(isEditableTarget(target({ tagName: 'DIV', isContentEditable: true }))).toBe(true);
  });

  it('leaves a button, a checkbox and the page itself alone', () => {
    expect(isEditableTarget(target({ tagName: 'BUTTON' }))).toBe(false);
    expect(isEditableTarget(target({ tagName: 'INPUT', type: 'checkbox' }))).toBe(false);
    expect(isEditableTarget({ target: null } as unknown as KeyboardEvent)).toBe(false);
  });
});
