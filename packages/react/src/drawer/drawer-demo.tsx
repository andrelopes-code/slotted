import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A box an overlay drawer can open inside, so a demonstration is a panel in a
 * scene rather than a full-page layer drawn over the reference page it
 * documents.
 *
 * `.slotted-demo-viewport` carries `contain: paint`, which makes it the
 * containing block for the `position: fixed` layer; `data-size="tall"` is the
 * height an overlay needs. The `container` prop is the same one an application
 * shell uses to name its own stacking context, so nothing here is a demo-only
 * escape hatch.
 *
 * The caption of every scene using this says so: in an application the
 * containing block is the viewport, and the drawer covers the page.
 */
export function Layer({
  children,
  size = 'tall',
}: {
  children: (container: Element) => ReactNode;
  /** `screen` for a sheet whose stops are fractions of a phone-tall layer. */
  size?: 'tall' | 'screen';
}) {
  const [box, setBox] = useState<HTMLElement | null>(null);

  return (
    <div className="slotted-demo-viewport" data-size={size} ref={setBox}>
      {box === null ? null : children(box)}
    </div>
  );
}

/**
 * The shape an inline drawer lives in: the consumer's own grid, with the drawer
 * in one track and the page in the other. It is written out rather than hidden
 * in a helper's stylesheet, because it *is* what replaces Angular Material's
 * `push` and MUI's `persistent` — the sibling reflows because this grid says
 * so, not because the family wrote a margin on an element it does not own.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-viewport" data-size="tall" data-layout="shell">
      {children}
    </div>
  );
}
