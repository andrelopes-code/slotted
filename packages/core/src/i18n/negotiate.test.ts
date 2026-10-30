import { describe, expect, it } from 'vitest';

import { negotiateLocale } from './negotiate';

describe('negotiateLocale', () => {
  const available = ['en-US', 'pt-BR', 'pt', 'de'];

  it('takes the requested tag when a catalog has it', () => {
    expect(negotiateLocale('pt-BR', available)).toBe('pt-BR');
  });

  it('drops subtags from the right until one is available', () => {
    expect(negotiateLocale('pt-PT', available)).toBe('pt');
    expect(negotiateLocale('de-CH-1996', available)).toBe('de');
  });

  it('matches without regard to case', () => {
    expect(negotiateLocale('PT-br', available)).toBe('pt-BR');
  });

  it('falls to en-US when nothing in the chain is available', () => {
    expect(negotiateLocale('ja-JP', available)).toBe('en-US');
    expect(negotiateLocale('', available)).toBe('en-US');
  });

  it('drops a single-letter extension with the subtag before it', () => {
    expect(negotiateLocale('pt-BR-u-nu-latn', available)).toBe('pt-BR');
  });
});
