import type { ReactNode } from 'react';

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story composes this
 * rather than laying itself out, so no two examples end up against each other
 * and no story reaches for an inline style.
 */
export function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: ReactNode;
  label: string;
  layout?: 'block' | 'row' | 'stack' | 'prose';
  note: ReactNode;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

export function Grid({ children, columns = 1 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  return (
    <div className="slotted-demo-grid" data-columns={String(columns)}>
      {children}
    </div>
  );
}

/**
 * The ground every demonstration on this page opens inside.
 *
 * A popover is portalled to the end of the document by default, which is right
 * in an application and wrong on a page of stacked scenes: a layer opened in
 * one scene would draw over the scene above it. `.slotted-demo-viewport` is the
 * workbench's own box for exactly this — `contain: paint` makes it the
 * containing block for the layer and clips it to the scene — and every
 * demonstration here pairs it with `portal={false}`. The one demonstration
 * about the portal itself says so in its caption.
 */
export function Viewport({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-viewport" data-place="top" data-size="tall">
      <div className="slotted-demo-row">{children}</div>
    </div>
  );
}
