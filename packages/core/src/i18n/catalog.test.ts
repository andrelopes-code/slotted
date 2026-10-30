import { describe, expect, it } from 'vitest';

import { breadcrumbMessages, dataGridMessages, EN_US, topNavigationMessages } from './catalog';
import { createTranslator } from './index';
import { isWellFormed, messageSlots } from './format';
import { PT_BR } from './locales/pt-BR';

/** Every leaf of a catalog as `[path, message]`. */
function leaves(tree: object, prefix = ''): [string, unknown][] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return value !== null && typeof value === 'object'
      ? leaves(value as object, path)
      : [[path, value] as [string, unknown]];
  });
}

// language: pt-BR
const PORTUGUESE = /[ãõçáéíóúâêôà]/;
// language: en-US

describe('the catalogs', () => {
  const en = new Map(leaves(EN_US));
  const pt = new Map(leaves(PT_BR));

  it('writes every base message as a string the grammar reads', () => {
    const malformed = [...en].filter(([, m]) => typeof m !== 'string' || !isWellFormed(m));
    expect(malformed).toEqual([]);
  });

  it('writes the base in English', () => {
    const portuguese = [...en].filter(([, m]) => typeof m === 'string' && PORTUGUESE.test(m));
    expect(portuguese).toEqual([]);
  });

  it('gives pt-BR exactly the keys of en-US', () => {
    expect([...pt.keys()].sort()).toEqual([...en.keys()].sort());
  });

  it('gives every pt-BR message the slots of its en-US message', () => {
    const differ = [...en].flatMap(([path, m]) => {
      const translated = pt.get(path);
      if (typeof m !== 'string' || typeof translated !== 'string') return [];
      const want = messageSlots(m).sort();
      const got = messageSlots(translated).sort();
      return want.join() === got.join() ? [] : [{ path, want, got }];
    });
    expect(differ).toEqual([]);
  });

  it('writes every pt-BR message as a string the grammar reads', () => {
    const malformed = [...pt].filter(([, m]) => typeof m !== 'string' || !isWellFormed(m));
    expect(malformed).toEqual([]);
  });

  it('counts rows in each language', () => {
    const en = createTranslator({ locale: 'en-US' }).family(dataGridMessages);
    const pt = createTranslator({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }).family(
      dataGridMessages,
    );
    expect([1, 2].map((count) => en('groupCount', { count }))).toEqual(['1 row', '2 rows']);
    // language: pt-BR
    expect([1, 2].map((count) => pt('groupCount', { count }))).toEqual(['1 linha', '2 linhas']);
    // language: en-US
  });

  it('types the count every counting message reads', () => {
    const breadcrumb = createTranslator({ locale: 'en-US' }).family(breadcrumbMessages);
    const top = createTranslator({ locale: 'en-US' }).family(topNavigationMessages);
    expect(breadcrumb('showHidden', { count: 2 })).toBe('Show 2 hidden levels');
    expect(top('moreCount', { count: 3 })).toBe('More, 3');
    // @ts-expect-error a count is a number
    breadcrumb('showHidden', { count: 'two' });
    // @ts-expect-error a count is a number
    top('moreCount', { count: 'three' });
  });
});
