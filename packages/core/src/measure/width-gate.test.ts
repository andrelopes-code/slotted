import { describe, expect, it, vi } from 'vitest';

import { createWidthGate } from './width-gate';

/**
 * The gate is a width and a callback. The element is a stub with a rect,
 * because what is under test is the rule — under the width, over it, and the
 * one report per change — and not a layout engine.
 */
function elementOf(width: number) {
  let current = width;
  const element = {
    getBoundingClientRect: () => ({ width: current }),
  } as unknown as HTMLElement;
  return {
    element,
    resize(next: number) {
      current = next;
    },
  };
}

describe('createWidthGate', () => {
  it('reports the first answer without waiting for a resize', () => {
    const onChange = vi.fn();
    const { element } = elementOf(80);

    const gate = createWidthGate(element, { at: 120, onChange });

    expect(gate.narrow()).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
    gate.destroy();
  });

  it('says nothing while the answer has not changed', () => {
    const onChange = vi.fn();
    const { element, resize } = elementOf(200);

    const gate = createWidthGate(element, { at: 120, onChange });
    expect(onChange).not.toHaveBeenCalled();

    resize(160);
    gate.refresh();
    expect(onChange).not.toHaveBeenCalled();

    resize(119);
    gate.refresh();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
    gate.destroy();
  });

  it('opens again when the room comes back', () => {
    const onChange = vi.fn();
    const { element, resize } = elementOf(100);

    const gate = createWidthGate(element, { at: 120, onChange });
    resize(240);
    gate.refresh();

    expect(gate.narrow()).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
    gate.destroy();
  });

  /**
   * An element with no box has not been measured. Treating nought as "narrower
   * than anything" would swap the preview for the sentence on the first frame
   * of every render that happens before layout.
   */
  it('leaves the gate open for an element that has not been laid out', () => {
    const onChange = vi.fn();
    const { element } = elementOf(0);

    const gate = createWidthGate(element, { at: 120, onChange });

    expect(gate.narrow()).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    gate.destroy();
  });
});
