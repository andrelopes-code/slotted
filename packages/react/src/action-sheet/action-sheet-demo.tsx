import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * A box a sheet can open inside, so a demonstration is a sheet in a scene
 * rather than a layer drawn over the reference page it documents.
 *
 * `.slotted-demo-viewport` carries `contain: paint`, which makes it the
 * containing block for the fixed layer; `data-size="tall"` is the height a
 * sheet needs. `container` is the same prop an application shell uses to name
 * its own stacking context, so nothing here is a demo-only escape hatch. In an
 * application the containing block is the viewport.
 */
export function Layer({ children }: { children: (container: Element) => ReactNode }) {
  const [box, setBox] = useState<HTMLElement | null>(null);

  return (
    <div className="slotted-demo-viewport" data-size="tall" ref={setBox}>
      {box === null ? null : children(box)}
    </div>
  );
}
