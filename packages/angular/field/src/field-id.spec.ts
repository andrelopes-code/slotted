import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { SlFieldIdFactory } from './field-id';

describe('SlFieldIdFactory', () => {
  it('produces the same sequence for two independent application injectors', () => {
    const create = () =>
      Injector.create({
        providers: [{ provide: SlFieldIdFactory, useClass: SlFieldIdFactory }],
      }).get(SlFieldIdFactory);

    const first = create();
    const second = create();

    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next(),
    ]);
  });

  it('never repeats an identifier within one injector', () => {
    const factory = Injector.create({
      providers: [{ provide: SlFieldIdFactory, useClass: SlFieldIdFactory }],
    }).get(SlFieldIdFactory);

    const ids = [factory.next(), factory.next(), factory.next()];

    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toMatch(/^slotted-field-\d+$/);
  });
});
