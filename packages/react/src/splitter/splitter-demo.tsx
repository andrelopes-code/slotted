import type { ReactNode, RefObject } from 'react';

/**
 * The ground a separator is demonstrated on.
 *
 * Two regions and a movable boundary, from `.slotted-demo-workspace` in the
 * workbench: a bar with nothing either side of it shows nothing, and regions
 * painted by the story reach for the inline style
 * `specs/reference-pages.test.mjs` refuses.
 *
 * The sized region reads `--slotted-splitter-value`, which is the property the
 * family writes on the element it was handed. Nothing here holds a measure, so
 * the picture moves because the family moves it.
 */
export function Workspace({
  children,
  orientation = 'vertical',
}: {
  children: ReactNode;
  orientation?: 'vertical' | 'horizontal';
}) {
  return (
    <div className="slotted-demo-viewport" data-size="tall">
      <div className="slotted-demo-workspace" data-orientation={orientation}>
        {children}
      </div>
    </div>
  );
}

/** The region the bar sizes. */
export function Region({
  children,
  ref,
}: {
  children: ReactNode;
  ref?: RefObject<HTMLElement | null>;
}) {
  return (
    <aside className="slotted-demo-workspace__region" ref={ref as RefObject<HTMLElement>}>
      {children}
    </aside>
  );
}

/** Whatever the region and the bar leave. */
export function Body({ children }: { children: ReactNode }) {
  return <main className="slotted-demo-workspace__body">{children}</main>;
}
