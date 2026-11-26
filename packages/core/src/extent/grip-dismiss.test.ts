import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { attachGripDismiss } from './grip-dismiss';

/** jsdom has no `PointerEvent` constructor; a mouse event with the pointer's fields stands in. */
function pointer(type: string, clientY: number, timeStamp: number): PointerEvent {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientY }) as PointerEvent;
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  return event;
}

describe('attachGripDismiss', () => {
  let grip: HTMLElement;
  let sheet: HTMLElement;
  let onDismiss: ReturnType<typeof vi.fn<(event: PointerEvent) => void>>;
  let detach: () => void;

  beforeEach(() => {
    sheet = document.createElement('div');
    grip = document.createElement('span');
    sheet.append(grip);
    document.body.append(sheet);
    Object.defineProperty(sheet, 'offsetHeight', { value: 400 });
    onDismiss = vi.fn<(event: PointerEvent) => void>();
    detach = attachGripDismiss({ grip, sheet, onDismiss });
  });

  afterEach(() => {
    detach();
    sheet.remove();
  });

  /** A pull of `by` pixels over `ms` milliseconds, released at once. */
  function pull(by: number, ms: number) {
    grip.dispatchEvent(pointer('pointerdown', 100, 0));
    grip.dispatchEvent(pointer('pointermove', 100 + by / 2, ms / 2));
    grip.dispatchEvent(pointer('pointermove', 100 + by, ms));
    grip.dispatchEvent(pointer('pointerup', 100 + by, ms));
  }

  it('moves the sheet with the hand', () => {
    grip.dispatchEvent(pointer('pointerdown', 100, 0));
    grip.dispatchEvent(pointer('pointermove', 160, 50));

    expect(sheet.style.translate).toBe('0 60px');
    expect(sheet.style.transition).toBe('none');
  });

  it('dismisses past half the sheet, and keeps the offset it was let go at', () => {
    pull(240, 1000);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(sheet.style.translate).toBe('0 240px');
  });

  it('dismisses on a flick down shorter than half', () => {
    pull(80, 50);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('puts the sheet back on a slow, short pull', () => {
    pull(120, 1000);

    expect(onDismiss).not.toHaveBeenCalled();
    expect(sheet.style.translate).toBe('');
    expect(sheet.style.transition).toBe('');
  });

  it('takes a pull up as no pull', () => {
    pull(-200, 50);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('takes the offset of a dismissal back on the next attach', () => {
    pull(240, 1000);
    detach();

    detach = attachGripDismiss({ grip, sheet, onDismiss });

    expect(sheet.style.translate).toBe('');
  });

  it('dims the scrim with the pull, and gives it back to the stylesheet on a release', () => {
    detach();
    const scrim = document.createElement('div');
    detach = attachGripDismiss({ grip, scrim, sheet, onDismiss });

    grip.dispatchEvent(pointer('pointerdown', 100, 0));
    grip.dispatchEvent(pointer('pointermove', 200, 500));
    expect(scrim.style.opacity).toBe('0.75');
    expect(scrim.style.transition).toBe('none');

    grip.dispatchEvent(pointer('pointerup', 200, 1000));
    expect(scrim.style.opacity).toBe('');
    expect(scrim.style.transition).toBe('');
  });

  it('hands the scrim to the closing stylesheet in the task of a dismissing pull', () => {
    detach();
    const scrim = document.createElement('div');
    const seen: string[] = [];
    onDismiss.mockImplementation(() => seen.push(scrim.style.opacity));
    detach = attachGripDismiss({ grip, scrim, sheet, onDismiss });

    pull(300, 1000);

    expect(seen).toEqual(['0.25']);
    expect(scrim.style.opacity).toBe('');
    expect(scrim.style.transition).toBe('');
  });
});
