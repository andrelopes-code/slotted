import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A box a layer can open inside, so a demonstration is a panel in a scene
 * rather than a full-page overlay drawn over the reference page it documents.
 *
 * `.slotted-demo-viewport` carries `contain: paint`, which makes it the
 * containing block for the `position: fixed` layer; `data-size="tall"` is the
 * height an overlay needs, added to the workbench when this family met it. The
 * `container` prop is the same one an application shell uses to name its own
 * stacking context, so nothing here is a demo-only escape hatch.
 *
 * The caption of every scene using this says so: in an application the
 * containing block is the viewport, and the layer covers the page.
 */
export function Layer({ children }: { children: (container: Element) => ReactNode }) {
  const [box, setBox] = useState<HTMLElement | null>(null);

  return (
    <div className="slotted-demo-viewport" data-size="tall" ref={setBox}>
      {box === null ? null : children(box)}
    </div>
  );
}

/**
 * A layout of the consumer's own inside the panel, which skips the header and
 * the body: it reads the inset the panel states, which is what the scene
 * demonstrates, so the padding is the subject and not a paint.
 */
export function OwnLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--slotted-space-5)',
        paddingBlock: 'var(--slotted-dialog-inset-block)',
        paddingInline: 'var(--slotted-dialog-inset-inline)',
      }}
    >
      {children}
    </div>
  );
}
