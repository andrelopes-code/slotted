import { cdp } from 'vitest/browser';

/**
 * A real press at the center of an element, or at a point inside it, through
 * the browser's input pipeline: the default actions of a pointer, a mouse or
 * a touch — focus among them — run as they do under a person's hand. The
 * browser project gives the page and the test frame one size
 * (`vitest.config.ts`), so the point only shifts by the frame's offset.
 */
export async function press(
  element: Element,
  pointer: 'mouse' | 'touch',
  at?: { x: number; y: number },
): Promise<void> {
  const rect = element.getBoundingClientRect();
  const local = at ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const frame = window.frameElement?.getBoundingClientRect();
  const x = (frame?.left ?? 0) + local.x;
  const y = (frame?.top ?? 0) + local.y;
  const session = cdp();
  if (pointer === 'mouse') {
    for (const type of ['mousePressed', 'mouseReleased'] as const) {
      await session.send('Input.dispatchMouseEvent', {
        type,
        x,
        y,
        button: 'left',
        buttons: type === 'mousePressed' ? 1 : 0,
        clickCount: 1,
      });
    }
    return;
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
