import { describe, expect, it } from 'vitest';

import { formatNameList, initialsFrom, toneFrom } from './index';

const TONES = ['accent', 'secondary', 'success', 'warning', 'danger'] as const;

describe('initialsFrom', () => {
  it('takes the first letter of the first and last words', () => {
    expect(initialsFrom({ name: 'Ada Lovelace' })).toBe('AL');
    expect(initialsFrom({ name: 'Grace Brewster Murray Hopper' })).toBe('GH');
  });

  it('takes one letter from a single word', () => {
    expect(initialsFrom({ name: 'Prince' })).toBe('P');
  });

  it('honours a ceiling of one, which is what the smallest avatar renders', () => {
    expect(initialsFrom({ name: 'Ada Lovelace', max: 1 })).toBe('A');
  });

  it('reads nothing from a name that is empty or only spaces', () => {
    expect(initialsFrom({ name: '' })).toBe('');
    expect(initialsFrom({ name: '   ' })).toBe('');
    expect(initialsFrom({ name: undefined })).toBe('');
  });

  /**
   * A real product passes an address when it has nothing better, and the whole
   * string starts with a lower-case letter that is not the person's initial.
   */
  it('reads a name out of an email address', () => {
    expect(initialsFrom({ name: 'ada.lovelace@example.com' })).toBe('AL');
    expect(initialsFrom({ name: 'ada@example.com' })).toBe('A');
    expect(initialsFrom({ name: 'grace_hopper@example.com' })).toBe('GH');
  });

  /** A surrogate pair is one letter, and `charAt(0)` returns half of it. */
  it('never splits a grapheme in half', () => {
    expect(initialsFrom({ name: '𝒜da 𝔏ovelace' })).toBe('𝒜𝔏');
    expect(initialsFrom({ name: 'Ａda' })).toBe('Ａ');
  });

  it('keeps a combining mark with the letter it belongs to', () => {
    /* `A` followed by U+0301, which is a different string from `Á`. */
    expect(initialsFrom({ name: 'Áda Lovelace' })).toBe('ÁL');
  });

  it('upper-cases for the locale rather than for English', () => {
    expect(initialsFrom({ name: 'işık ışık', locale: 'tr' })).toBe('İI');
    expect(initialsFrom({ name: 'işık ışık', locale: 'en' })).toBe('II');
  });

  it('reads scripts that have no case, and scripts written right to left', () => {
    expect(initialsFrom({ name: '山田 太郎' })).toBe('山太');
    expect(initialsFrom({ name: '山田太郎' })).toBe('山');
    expect(initialsFrom({ name: 'Ада Лавлейс' })).toBe('АЛ');
    expect(initialsFrom({ name: 'محمد صلاح' })).toBe('مص');
  });

  it('skips a word that carries no letter or number at all', () => {
    expect(initialsFrom({ name: 'Ada — Lovelace' })).toBe('AL');
    expect(initialsFrom({ name: '(Ada) [Lovelace]' })).toBe('AL');
    expect(initialsFrom({ name: '···' })).toBe('');
  });

  it('steps over the punctuation a word opens with, whatever it is', () => {
    expect(initialsFrom({ name: '¿Ada? ¡Lovelace!' })).toBe('AL');
    expect(initialsFrom({ name: '“Ada” ‘Lovelace’' })).toBe('AL');
    expect(initialsFrom({ name: '@ada #lovelace' })).toBe('AL');
    expect(initialsFrom({ name: '🎉Ada 🎉Lovelace' })).toBe('AL');
  });

  /**
   * The last "word" of a real name is very often not part of the name: a
   * pronoun set, a team, a role, or the address a mail header appends. Taking
   * its first letter puts a stranger's initial on the person's face.
   */
  it('drops what a name carries in brackets rather than reading an initial out of it', () => {
    expect(initialsFrom({ name: 'Ada Lovelace (she/her)' })).toBe('AL');
    expect(initialsFrom({ name: 'Ada Lovelace [Admin]' })).toBe('AL');
    expect(initialsFrom({ name: 'Ada Lovelace {contractor}' })).toBe('AL');
    expect(initialsFrom({ name: 'Ada Lovelace <ada@example.com>' })).toBe('AL');
    expect(initialsFrom({ name: '(Dr) Ada Lovelace' })).toBe('AL');
  });

  /** A name that is nothing but a bracketed word still has a word in it. */
  it('reads the brackets when dropping them would leave nothing', () => {
    expect(initialsFrom({ name: '(anonymous)' })).toBe('A');
    expect(initialsFrom({ name: '[Ada Lovelace]' })).toBe('AL');
  });

  /**
   * A digit is content rather than punctuation — `3M` and `7-Eleven` are names
   * whose initial is a figure — so a letter is preferred and a figure is taken
   * only when the word has no letter at all.
   */
  it('prefers a letter to a figure, and takes a figure when there is no letter', () => {
    expect(initialsFrom({ name: '3M' })).toBe('M');
    expect(initialsFrom({ name: 'Studio 54' })).toBe('S5');
    expect(initialsFrom({ name: '7-Eleven Japan' })).toBe('EJ');
  });

  it('reads the emoji a name is entirely made of rather than pretending it has none', () => {
    expect(initialsFrom({ name: '🐙' })).toBe('');
  });
});

describe('toneFrom', () => {
  it('gives the same seed the same tone, every time and in both bindings', () => {
    const once = toneFrom({ seed: 'Ada Lovelace', tones: TONES });
    expect(toneFrom({ seed: 'Ada Lovelace', tones: TONES })).toBe(once);
    expect(once).not.toBeUndefined();
  });

  /**
   * The hash has to spread, not merely to be stable: a palette of five that
   * answers `accent` for four names in every five is a palette of one. Measured
   * over five hundred seeds, every tone takes between a tenth and a third of
   * them — a uniform draw would take a fifth.
   */
  it('spreads over the whole palette rather than favouring one tone', () => {
    const seeds = Array.from({ length: 500 }, (_, index) => `person-${index}@example.com`);
    const used = new Map<string, number>();
    for (const seed of seeds) {
      const tone = toneFrom({ seed, tones: TONES }) as string;
      used.set(tone, (used.get(tone) ?? 0) + 1);
    }

    expect([...used.keys()].sort()).toEqual([...TONES].sort());
    for (const [tone, count] of used) {
      expect(count, tone).toBeGreaterThan(seeds.length * 0.1);
      expect(count, tone).toBeLessThan(seeds.length * 0.33);
    }
  });

  /** Two people whose names differ by one letter do not have to differ in colour, but they usually do. */
  it('separates names that differ only slightly, most of the time', () => {
    const pairs: [string, string][] = [
      ['Ada Lovelace', 'Ada Lovelacf'],
      ['Grace Hopper', 'Grace Hoppes'],
      ['Alan Turing', 'Alan Turinh'],
    ];
    const differing = pairs.filter(
      ([left, right]) =>
        toneFrom({ seed: left, tones: TONES }) !== toneFrom({ seed: right, tones: TONES }),
    );
    expect(differing.length).toBeGreaterThan(1);
  });

  it('answers nothing for a seed that carries no identity', () => {
    expect(toneFrom({ seed: '', tones: TONES })).toBeUndefined();
    expect(toneFrom({ seed: '   ', tones: TONES })).toBeUndefined();
    expect(toneFrom({ seed: undefined, tones: TONES })).toBeUndefined();
  });

  it('answers nothing when there is no palette to choose from', () => {
    expect(toneFrom({ seed: 'Ada Lovelace', tones: [] })).toBeUndefined();
  });

  /** The seed is the identifier when there is one, so two people named alike still differ. */
  it('reads whatever seed it is given, not only a name', () => {
    expect(toneFrom({ seed: 'user-8842', tones: TONES })).toBe(
      toneFrom({ seed: 'user-8842', tones: TONES }),
    );
  });
});

describe('formatNameList', () => {
  it('joins names the way the locale joins them', () => {
    expect(formatNameList({ names: ['Ada', 'Grace', 'Alan'], locale: 'en-GB' })).toBe(
      'Ada, Grace and Alan',
    );
    expect(formatNameList({ names: ['Ada', 'Grace', 'Alan'], locale: 'pt-BR' })).toBe(
      'Ada, Grace e Alan',
    );
    expect(formatNameList({ names: ['Ada', 'Grace'], locale: 'de-DE' })).toBe('Ada und Grace');
  });

  it('writes one name as itself', () => {
    expect(formatNameList({ names: ['Ada'], locale: 'en-GB' })).toBe('Ada');
  });

  it('writes nothing for no names', () => {
    expect(formatNameList({ names: [], locale: 'en-GB' })).toBeUndefined();
  });

  /** A member with no name is a member, and dropping it would miscount the list. */
  it('drops a blank name rather than joining an empty string', () => {
    expect(formatNameList({ names: ['Ada', '', '  ', 'Alan'], locale: 'en-GB' })).toBe(
      'Ada and Alan',
    );
  });
});
