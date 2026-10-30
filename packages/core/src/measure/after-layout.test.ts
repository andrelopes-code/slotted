import { describe, expect, it } from 'vitest';

import { afterLayout } from './after-layout';

/** A document whose `ResizeObserver` reports when the test says layout ran. */
function fakeDocument() {
  const reports: (() => void)[] = [];
  class Observer {
    constructor(private readonly callback: () => void) {}
    observe() {
      reports.push(() => this.callback());
    }
    disconnect() {}
  }
  const doc = {
    defaultView: { ResizeObserver: Observer },
    documentElement: {},
  } as unknown as Document;
  return { doc, layout: () => reports.splice(0).forEach((report) => report()) };
}

describe('afterLayout', () => {
  it('runs every read before any write, in one report per document', () => {
    const { doc, layout } = fakeDocument();
    const order: string[] = [];
    afterLayout(
      doc,
      () => order.push('read a'),
      () => order.push('write a'),
    );
    afterLayout(
      doc,
      () => order.push('read b'),
      () => order.push('write b'),
    );
    expect(order).toEqual([]);

    layout();
    expect(order).toEqual(['read a', 'read b', 'write a', 'write b']);
  });

  it('drops work cancelled before the layout', () => {
    const { doc, layout } = fakeDocument();
    const order: string[] = [];
    const cancel = afterLayout(doc, () => order.push('read'));
    cancel();
    layout();
    expect(order).toEqual([]);
  });

  it('runs at once in a document without ResizeObserver', () => {
    const order: string[] = [];
    afterLayout(
      { defaultView: {} } as unknown as Document,
      () => order.push('read'),
      () => order.push('write'),
    );
    expect(order).toEqual(['read', 'write']);
  });
});
